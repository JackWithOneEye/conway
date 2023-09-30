import 'htmx.org/dist/htmx';
import { CanvasWorkerMessageData } from './types';

const worker = new Worker('/static/worker/canvas.js');

function postMessage(msg: CanvasWorkerMessageData, transfer?: Transferable[]) {
  // @ts-expect-error
  worker.postMessage(msg, transfer);
}

let cellSize = 1;
addEventListener('initGame', () => {
  const wrapper = document.querySelector('#canvas-wrapper') as HTMLDivElement;
  const canvas = wrapper.querySelector('canvas');
  if (!canvas) {
    throw new Error(':(');
  }

  // cell size input
  const cellSizeIpt = document.querySelector('#cell-size') as HTMLInputElement;
  const cellSizeState = document.querySelector('#cell-size-state') as HTMLSpanElement;
  cellSize = Number(cellSizeIpt.value);
  cellSizeIpt.addEventListener('input', function () {
    cellSize = Number(cellSizeIpt.value);
    cellSizeState.innerHTML = cellSizeIpt.value;
    postMessage({
      value: cellSize,
      type: 'cellSizeChange'
    });
  });

  const offscreen = canvas.transferControlToOffscreen();
  postMessage({
    canvas: offscreen,
    cellSize: cellSize,
    speed: 200 / 3,
    type: 'init'
  }, [offscreen]);

  const resObs = new ResizeObserver(function (entries) {
    const { height, width } = entries[0].contentRect;
    postMessage({
      height: height - cellSize,
      width: width - cellSize,
      type: 'resize'
    });
  });
  resObs.observe(wrapper);


  // cell colour input
  const cellColourIpt = document.querySelector('#cell-colour') as HTMLInputElement;
  const cellColourState = document.querySelector('#cell-colour-state') as HTMLSpanElement;
  let cellColour = Number(`0x${cellColourIpt.value.substring(1)}`);
  cellColourIpt.addEventListener('change', function () {
    cellColour = Number(`0x${cellColourIpt.value.substring(1)}`);
    cellColourState.innerHTML = cellColourIpt.value;
  });

  // canvas
  canvas.addEventListener('click', function (e) {
    postMessage({ x: e.offsetX, y: e.offsetY, colour: cellColour, type: 'canvasOnClick' })
    e.preventDefault();
  });

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