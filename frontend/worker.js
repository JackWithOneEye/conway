import Engine from './engine'

/** @type {Worker} */
const w = self;

/** @type {OffscreenCanvas} */
let osCanvas;
/** @type {OffscreenCanvasRenderingContext2D} */
let ctx;
/** @type {number} */
let cellSize;

const engine = new Engine([0, 10 << 16 | 10, 11 << 16 | 10]);

function drawGrid() {
  const { height, width } = osCanvas;
  for (let x = cellSize; x <= width; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, width);
  }
  for (let y = cellSize; y <= height; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.strokeStyle = '#999';
  ctx.lineWidth = .25;
  ctx.stroke();
}

function draw() {
  const { height, width } = osCanvas;
  ctx.clearRect(0, 0, width, height);
  drawGrid();
  ctx.fillStyle = 'black';
  for (const [x, y] of engine.aliveCells()) {
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  }
}

function foo() {
  timer = setInterval(function () {
    engine.computeNextGen();
    draw();
  }, 100);
}

/**
 * @param {{data: CanvasWorkerMessageData}} msg 
 */
w.onmessage = function ({ data }) {
  if (data.type === 'init') {
    osCanvas = data.canvas;
    ctx = osCanvas.getContext('2d', { alpha: true });
    cellSize = data.cellSize;
    // foo();
  } else if (data.type === 'resize') {
    osCanvas.height = data.height;
    osCanvas.width = data.width;
    draw();
  }
}