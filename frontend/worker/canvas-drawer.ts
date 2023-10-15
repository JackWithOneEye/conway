const STROKE_STYLE = '#ccc';
const GRID_LINE_WIDTH = .5;

class CanvasDrawer {

  set cellSize(cs: number) {
    this._cellSize = cs;
    this.canvasLength = this._cellSize * this.axisLength;
  }

  set offset({ x, y }: { x: number; y: number }) {
    if (Math.abs(x) >= this.canvasLength) {
      x = Math.sign(x) * (Math.abs(x) - this.canvasLength);
    }
    if (Math.abs(y) >= this.canvasLength) {
      y = Math.sign(y) * (Math.abs(y) - this.canvasLength);
    }
    this._offset.x = x;
    this._offset.y = y;
  }

  private canvasLength: number;
  private _cellSize = 10;
  private ctx: OffscreenCanvasRenderingContext2D;
  private _offset = { x: 0, y: 0 };

  constructor(
    private axisLength: number,
    private canvas: OffscreenCanvas
  ) {
    this.canvasLength = this._cellSize * this.axisLength;
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
  }

  draw(cellsIter: Generator<[number, number, number], void>) {
    const { height, width } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawGrid();
    for (const [x, y, colour] of cellsIter) {
      this.fillCell(x, y, colour);
    }
  }

  drawCell(x: number, y: number, colour: number) {
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = GRID_LINE_WIDTH;
    this.ctx.strokeRect(
      x * this._cellSize + GRID_LINE_WIDTH + this._offset.x,
      y * this._cellSize + GRID_LINE_WIDTH + this._offset.y,
      this._cellSize - GRID_LINE_WIDTH,
      this._cellSize - GRID_LINE_WIDTH
    );
    this.fillCell(x, y, colour);
  }

  incrementOffset(x: number, y: number) {
    let ox = this._offset.x + x;
    if (Math.abs(ox) >= this.canvasLength) {
      ox = Math.sign(ox) * (Math.abs(ox) - this.canvasLength);
    }
    this._offset.x = ox;
    let oy = this._offset.y + y;
    if (Math.abs(oy) >= this.canvasLength) {
      oy = Math.sign(oy) * (Math.abs(oy) - this.canvasLength);
    }
    this._offset.y = oy;
  }

  pixelToCellCoord(px: number, py: number) {
    return [
      Math.floor((px - this._offset.x) / this._cellSize),
      Math.floor((py - this._offset.y) / this._cellSize)
    ] as const;
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
    this.ctx.beginPath();
    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = GRID_LINE_WIDTH;

    let x = this._offset.x % this._cellSize;
    while (x <= this.canvasLength) {
      this.ctx.moveTo(x + 0.5, 0);
      this.ctx.lineTo(x + 0.5, this.canvasLength);
      x += this._cellSize;
    }

    let y = this._offset.y % this._cellSize;
    while (y <= this.canvasLength) {
      this.ctx.moveTo(0, y + 0.5);
      this.ctx.lineTo(this.canvasLength, y + 0.5);
      y += this._cellSize;
    }

    this.ctx.strokeStyle = STROKE_STYLE;
    this.ctx.lineWidth = GRID_LINE_WIDTH;
    this.ctx.stroke();
  }

  private fillCell(x: number, y: number, colour: number) {
    this.setCellColour(colour);
    x = x * this._cellSize + this._offset.x;
    y = y * this._cellSize + this._offset.y;

    if (x >= this.canvasLength) {
      x -= this.canvasLength;
    } else if (x < 0) {
      x += this.canvasLength;
    }

    if (y >= this.canvasLength) {
      y -= this.canvasLength;
    } else if (y < 0) {
      y += this.canvasLength;
    }

    this.ctx.fillRect(
      x + GRID_LINE_WIDTH,
      y + GRID_LINE_WIDTH,
      this._cellSize - GRID_LINE_WIDTH,
      this._cellSize - GRID_LINE_WIDTH
    );
  }
}
export default CanvasDrawer;