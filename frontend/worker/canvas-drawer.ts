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

  draw(cellsIter: Generator<[number, number, number], void>) {
    const { height, width } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    for (const [x, y, colour] of cellsIter) {
      this.setCellColour(colour);
      this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    }
    this.drawGrid();
  }

  drawCell(x: number, y: number, colour: number) {
    this.setCellColour(colour);
    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = this.cellSize * 0.1;
    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
  }

  setDimensions(h: number, w: number) {
    this.canvas.height = h;
    this.canvas.width = w;
  }

  private setCellColour(colour: number) {
    const r = (colour >> 16) & 0xff;
    const g = (colour >> 8) & 0xff;
    const b = colour & 0xff;
    this.ctx.fillStyle = `rgb(${r},${g},${b})`;
  }

  private drawGrid() {
    const length = this.cellSize * this.axisLength;
    this.ctx.beginPath();
    for (let x = 0; x <= length; x += this.cellSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, length);
    }
    for (let y = 0; y <= length; y += this.cellSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(length, y);
    }
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = this.cellSize * 0.1;
    this.ctx.stroke();
  }
}
export default CanvasDrawer;