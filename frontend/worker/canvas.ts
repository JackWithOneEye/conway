import { CanvasWorkerMessageData } from '../types';
import CanvasDrawer from './canvas-drawer';
import Engine from './engine';
import Looper from './looper';

let drawer: CanvasDrawer;

const initState = [
  11 << 16 | 8, (255 << 0 | 0),
  12 << 16 | 9, (255 << 0 | 0),
  10 << 16 | 10, (255 << 0 | 0),
  11 << 16 | 10, (255 << 0 | 0),
  12 << 16 | 10, (255 << 0 | 0)
];
const engine = new Engine(initState);

function advance() {
  requestAnimationFrame(() => {
    engine.calcNextGen();
    drawer.draw(engine.aliveCells());
  });
}

const looper = new Looper(advance);

self.onmessage = function ({ data }: MessageEvent<CanvasWorkerMessageData>) {
  if (data.type === 'init') {
    drawer = new CanvasDrawer(engine.axisLength, data.canvas);
    drawer.cellSize = Math.max(1, data.cellSize * 0.5);
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
    drawer.cellSize = Math.max(1, data.value * 0.5);
    requestAnimationFrame(() => {
      drawer.draw(engine.aliveCells());
    });
    return;
  }

  if (data.type === 'speedChange') {
    const speed = Math.max(1, 1000 - Math.sqrt(data.value) * 100);
    looper.speed = speed;
    return;
  }

  if (data.type === 'canvasOnClick') {
    const { x, y, colour } = data;
    const cx = Math.floor(x / drawer.cellSize);
    const cy = Math.floor(y / drawer.cellSize);
    if (cx >= engine.axisLength || cy >= engine.axisLength) {
      return;
    }
    requestAnimationFrame(() => {
      const canDraw = engine.setAliveCell(cx, cy, colour);
      if (canDraw) {
        drawer.drawCell(cx, cy, colour);
      }
    });
  }
}