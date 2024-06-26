import CanvasDrawer from './canvas-drawer';
import Engine from './engine';
import { Command, MessageIndex, MessageType } from '../message';
import Looper from './looper';

let initialised = false;

/** @param {number} cellSize */
function scaleCellSize(cellSize) {
  return Math.round(2 + 0.38 * cellSize);
}

/**
 * @param {MessageEvent<import('../types').CanvasWorkerInitMessage>} param0 
 */
self.onmessage = function ({ data }) {
  if (initialised) {
    console.error(`[canvas.js] Already initialised!`);
    return;
  }

  if (data.type !== 'init') {
    console.error(`[canvas.js] Invalid message type: ${data.type}`);
    return;
  }

  const { canvas, cellSize, seed, height, width, messageBuffer } = data;

  const engine = new Engine();
  if (seed.length) {
    engine.setSeed(seed);
  }
  function postSeed() {
    queueMicrotask(() => {
      postMessage({ seed: engine.readSeed() });
    });
  }

  const drawer = new CanvasDrawer(engine.axisLength, canvas, scaleCellSize(cellSize), height, width);
  function draw() {
    requestAnimationFrame(() => {
      drawer.draw(engine.aliveCells());
    });
  }

  const looper = new Looper(() => {
    engine.calcNextGen();
    drawer.draw(engine.aliveCells());
    postSeed();
  });

  async function listen() {
    if (await Atomics.waitAsync(messageBuffer, MessageIndex.UPDATE, 1).value === 'ok') {
      const type = Atomics.load(messageBuffer, MessageIndex.TYPE);
      let redraw = false;

      if ((type & MessageType.RESIZE) === MessageType.RESIZE) {
        drawer.setDimensions(messageBuffer[MessageIndex.RESIZE_HEIGHT], messageBuffer[MessageIndex.RESIZE_WIDTH]);
        redraw = true;
      }

      if ((type & MessageType.COMMAND) === MessageType.COMMAND) {
        const cmd = messageBuffer[MessageIndex.COMMAND];
        switch (cmd) {
          case Command.NEXT:
            looper.requestAnimation();
            break;
          case Command.PLAY:
            looper.start();
            break;
          case Command.STOP:
            looper.stop();
            break;
          case Command.CLEAR:
            engine.clear();
            postSeed();
            redraw = true;
            break;
          case Command.FILL_RANDOM:
            engine.fillRandomly();
            postSeed();
            redraw = true;
            break;
        }
      }

      if ((type & MessageType.CELL_SIZE_CHANGE) === MessageType.CELL_SIZE_CHANGE) {
        drawer.cellSize = scaleCellSize(messageBuffer[MessageIndex.CELL_SIZE]);
        redraw = true;
      }

      if ((type & MessageType.SPEED_CHANGE) === MessageType.SPEED_CHANGE) {
        looper.speed = messageBuffer[MessageIndex.SPEED];
      }

      if ((type & MessageType.CANVAS_ON_DRAG) === MessageType.CANVAS_ON_DRAG) {
        drawer.incrementOffset(messageBuffer[MessageIndex.DRAG_X], messageBuffer[MessageIndex.DRAG_Y]);
        redraw = true;
      }

      if ((type & MessageType.CANVAS_ON_CLICK) === MessageType.CANVAS_ON_CLICK) {
        const x = messageBuffer[MessageIndex.CLICK_X];
        const y = messageBuffer[MessageIndex.CLICK_Y];
        const colour = messageBuffer[MessageIndex.CLICK_COLOUR];
        const [cx, cy] = drawer.pixelToCellCoord(x, y);
        const canDraw = engine.setAliveCell(cx, cy, colour);
        if (canDraw) {
          postSeed();
          redraw = true
        }
      }

      if ((type & MessageType.CANVAS_ON_DROP) === MessageType.CANVAS_ON_DROP) {
        const x = messageBuffer[MessageIndex.DROP_X];
        const y = messageBuffer[MessageIndex.DROP_Y];
        const colour = messageBuffer[MessageIndex.DROP_COLOUR];
        const length = messageBuffer[MessageIndex.DROP_PATTERN_LEN];
        const pattern = messageBuffer.slice(MessageIndex.DROP_PATTERN, MessageIndex.DROP_PATTERN + length);
        const [cx, cy] = drawer.pixelToCellCoord(x, y);
        let abort = false;
        /** @type {[number, number][]} */
        const coordinates = [];
        for (const pc of pattern) {
          const px = cx + ((pc >> 16) & 0xffff);
          const py = cy + (pc & 0xffff);
          if (!engine.canSetAliveCell(px, py)) {
            abort = true;
            break;
          }
          coordinates.push([px, py]);
        }
        if (!abort) {
          for (const [px, py] of coordinates) {
            engine.setAliveCell(px, py, colour, true);
          }
          postSeed();
          redraw = true;
        }
      }

      if (redraw) {
        draw();
      }
      Atomics.store(messageBuffer, MessageIndex.TYPE, 0);
    }
    listen();
  }

  draw();
  listen();
}