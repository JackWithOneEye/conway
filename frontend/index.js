import 'htmx.org/dist/htmx';
import './game-of-life';

const canvasWorker = new Worker('/static/worker/canvas.js', { type: 'module' });

window.initCanvasWorker = function (msg, offscreenCanvas) {
  canvasWorker.postMessage(msg, [offscreenCanvas]);
}

addEventListener('initGame', () => {
  const seedInput = /** @type {HTMLInputElement}*/ (document.querySelector('#seed-input'));

  /**
   * @param {MessageEvent<{ seed: number[] }>} e 
   */
  canvasWorker.onmessage = (e) => {
    seedInput.setAttribute('value', e.data.seed.map(v => v.toString(16)).join(','));
  };
});
