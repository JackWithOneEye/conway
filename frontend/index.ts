import 'htmx.org/dist/htmx';
import { CanvasWorkerMessageData } from './types';

const CELL_SIZE = 15;
const worker = new Worker('/static/worker/canvas.js');
function postMessage(msg: CanvasWorkerMessageData, transfer?: Transferable[]) {
  // @ts-expect-error
  worker.postMessage(msg, transfer);
}

addEventListener('initGame', () => {
  const wrapper = document.querySelector('#canvas-wrapper') as HTMLDivElement;
  const canvas = wrapper.querySelector('canvas');
  if (!canvas) {
    throw new Error(':(');
  }

  const offscreen = canvas.transferControlToOffscreen();
  postMessage({
    canvas: offscreen,
    cellSize: CELL_SIZE,
    speed: 200 / 3,
    type: 'init'
  }, [offscreen]);

  const resObs = new ResizeObserver(function (entries) {
    const { height, width } = entries[0].contentRect;
    postMessage({
      height: height - CELL_SIZE,
      width: width - CELL_SIZE,
      type: 'resize'
    });
  });
  resObs.observe(wrapper);

  canvas.addEventListener('click', function (e) {
    postMessage({ x: e.offsetX, y: e.offsetY, type: 'canvasOnClick' })
    e.preventDefault();
  })

  // speed input
  const speedIpt = document.querySelector('#speed') as HTMLInputElement;
  speedIpt.value = (200 / 3).toString(10);
  speedIpt.addEventListener('input', function () {
    postMessage({ value: Number(speedIpt.value), type: 'speedChange' })
  });

  // next button
  const nextBtn = document.querySelector('#next') as HTMLButtonElement;
  nextBtn.addEventListener('click', function () {
    postMessage({ command: 'next', type: 'control' })
  });

  // play button
  let playState = false;
  const playBtn = document.querySelector('#play') as HTMLButtonElement;
  playBtn.addEventListener('click', function () {
    if (!playState) {
      postMessage({ command: 'play', type: 'control' });
      playState = true;
      playBtn.innerHTML = 'STOP';
      return;
    }
    postMessage({ command: 'stop', type: 'control' });
    playState = false;
    playBtn.innerHTML = 'PLAY';
  });
}, { once: true });