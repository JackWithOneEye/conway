import 'htmx.org/dist/htmx';
import './game-of-life';
import type { CanvasWorkerMessageData } from './types';

window.canvasWorker = new Worker('/static/worker/canvas.js');

window.canvasWorkerMessage = function (msg: CanvasWorkerMessageData, transfer?: Transferable[]) {
  // @ts-expect-error
  canvasWorker.postMessage(msg, transfer);
};

addEventListener('initGame', () => {
  const seedInput = document.querySelector('#seed-input') as HTMLInputElement;
  canvasWorker.onmessage = (e: MessageEvent<{ seed: number[] }>) => {
    seedInput.setAttribute('value', e.data.seed.map(v => v.toString(16)).join(','));
  };
});