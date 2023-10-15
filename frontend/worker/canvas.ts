import { CanvasWorkerMessageData } from '../types';
import CanvasDrawer from './canvas-drawer';
import Engine from './engine';
import Looper from './looper';

let drawer: CanvasDrawer;

const engine = new Engine();

function advance() {
  engine.calcNextGen();
  requestAnimationFrame(() => {
    drawer.draw(engine.aliveCells());
  });
  postMessage({ seed: engine.readSeed() });
}

const looper = new Looper(advance);

self.onmessage = function ({ data }: MessageEvent<CanvasWorkerMessageData>) {
  if (data.type === 'init') {
    const { canvas, cellSize, seed } = data
    drawer = new CanvasDrawer(engine.axisLength, canvas);
    drawer.cellSize = Math.max(1, cellSize * 0.5);
    if (seed.length) {
      engine.setSeed(seed);
    }
    return;
  }

  if (data.type === 'resize') {
    drawer.setDimensions(data.height, data.width);
    requestAnimationFrame(() => {
      drawer.draw(engine.aliveCells());
    });
    return;
  }

  if (data.type === 'control') {
    if (data.command === 'next') {
      advance();
    } else if (data.command === 'play') {
      looper.start();
    } else if (data.command === 'stop') {
      looper.stop();
    }
    return;
  }

  if (data.type === 'cellSizeChange') {
    drawer.cellSize = Math.round(2 + (38 / 100) * data.value);
    requestAnimationFrame(() => {
      drawer.draw(engine.aliveCells());
    });
    return;
  }

  if (data.type === 'speedChange') {
    looper.speed = data.value;
    return;
  }

  if (data.type === 'canvasOnDrag') {
    drawer.incrementOffset(data.x, data.y);
    requestAnimationFrame(() => {
      drawer.draw(engine.aliveCells());
    });
    return;
  }

  if (data.type === 'canvasOnClick') {
    const { x, y, colour } = data;
    const [cx, cy] = drawer.pixelToCellCoord(x, y);
    if (cx >= engine.axisLength || cy >= engine.axisLength) {
      return;
    }
    const canDraw = engine.setAliveCell(cx, cy, colour);
    if (canDraw) {
      requestAnimationFrame(() => {
        drawer.drawCell(cx, cy, colour);
      });
      postMessage({ seed: engine.readSeed() });
    }
  }
}