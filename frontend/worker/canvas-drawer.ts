const STROKE_STYLE = '#999';

class CanvasDrawer {
  cellSize = 10;
  private ctx: OffscreenCanvasRenderingContext2D;

  constructor(
    private axisLength: number,
    private canvas: OffscreenCanvas
  ) {
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
  }

  draw(cellsIter: Generator<[number, number], void>) {
    const { height, width } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = 'black';
    for (const [x, y] of cellsIter) {
      this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    }
    this.drawGrid();
  }

  drawCell(x: number, y: number) {
    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = .6;
    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
  }

  setDimensions(h: number, w: number) {
    this.canvas.height = h;
    this.canvas.width = w;
  }

  private drawGrid() {
    const length = this.cellSize * this.axisLength;
    for (let x = 0; x <= length; x += this.cellSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, length);
    }
    for (let y = 0; y <= length; y += this.cellSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(length, y);
    }
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}
export default CanvasDrawer;