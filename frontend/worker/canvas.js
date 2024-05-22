import CanvasDrawer from './canvas-drawer';
import Engine from './engine';
import Looper from './looper';
import { Command, MessageIndex, MessageType } from '../message';

let initialised = false;

/** @type {CanvasDrawer} */
let drawer;

function draw() {
  // requestAnimationFrame(() => {
  // });
  drawer.draw(engine.aliveCells());
}

const engine = new Engine();

function postSeed() {
  queueMicrotask(() => {
    postMessage({ seed: engine.readSeed() });
  });
}

function advance() {
  engine.calcNextGen();
  draw();
  postSeed();
}

const looper = new Looper(advance);

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

  const { canvas, cellSize, seed, height, width, messageBuffer } = data
  drawer = new CanvasDrawer(engine.axisLength, canvas, scaleCellSize(cellSize), height, width);
  if (seed.length) {
    engine.setSeed(seed);
  }
  draw();

  async function listen() {
    if (await Atomics.waitAsync(messageBuffer, MessageIndex.UPDATE, 1).value === 'ok') {
      const type = Atomics.load(messageBuffer, MessageIndex.TYPE);
      let redraw = false;

      if ((type & MessageType.RESIZE) === MessageType.RESIZE) {
        drawer.setDimensions(messageBuffer[MessageIndex.RESIZE_HEIGHT], messageBuffer[MessageIndex.RESIZE_WIDTH]);
        redraw = true;
      }

      if ((type & MessageType.CONTROL) === MessageType.CONTROL) {
        const cmd = messageBuffer[MessageIndex.CONTROL_CMD];
        if (cmd === Command.NEXT) {
          advance();
        } else if (cmd === Command.PLAY) {
          looper.start();
        } else if (cmd === Command.STOP) {
          looper.stop();
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

      if ((type & MessageType.CANVAS_ONCLICK) === MessageType.CANVAS_ONCLICK) {
        const x = messageBuffer[MessageIndex.CLICK_X];
        const y = messageBuffer[MessageIndex.CLICK_Y];
        const colour = messageBuffer[MessageIndex.CLICK_COLOUR];
        const [cx, cy] = drawer.pixelToCellCoord(x, y);
        if (cx < engine.axisLength && cy < engine.axisLength) {
          const canDraw = engine.setAliveCell(cx, cy, colour);
          if (canDraw) {
            postSeed();
            redraw = true
          }
        }
      }
      if (redraw) {
        draw();
      }
      Atomics.store(messageBuffer, MessageIndex.TYPE, 0);
    }
    listen();
  }
  listen();
}