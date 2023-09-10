import htmx from 'htmx.org/dist/htmx';
window.htmx = htmx;

/** @type {HTMLDivElement} */
const wrapper = document.querySelector('#canvas-wrapper');
const canvas = document.querySelector('canvas');
if (!wrapper || !canvas) {
  throw new Error(':(');
}

const worker = new Worker('/static/worker.js');

const CELL_SIZE = 20;

const offscreen = canvas.transferControlToOffscreen();
/** @type {CanvasWorkerMessageData} */
const initMsg = {
  canvas: offscreen,
  cellSize: CELL_SIZE,
  type: 'init'
}
worker.postMessage(initMsg, [offscreen]);

const resObs = new ResizeObserver(function (entries) {
  const { height, width } = entries[0].contentRect;
  /** @type {CanvasWorkerMessageData} */
  const msg = {
    height: height - CELL_SIZE,
    width: width - CELL_SIZE,
    type: 'resize'
  }
  worker.postMessage(msg);
});
resObs.observe(wrapper);


