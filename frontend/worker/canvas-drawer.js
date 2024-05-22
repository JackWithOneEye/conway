const STROKE_STYLE = '#ccc';
const GRID_LINE_WIDTH = .5;

class CanvasDrawer {

  /** @param {number} cs */
  set cellSize(cs) {
    this.#cellSize = cs;
    this.#canvasLength = this.#cellSize * this.#axisLength;
  }

  /** @type {number} */
  #axisLength;
  /** @type {OffscreenCanvas} */
  #canvas;
  /** @type {number} */
  #canvasLength;
  /** @type {number} */
  #cellSize;
  /** @type {OffscreenCanvasRenderingContext2D} */
  #ctx;
  #offset = { x: 0, y: 0 };


  /** @type {[[number, number], [number, number]]} */
  #horizCoord = [[0, 0], [0, 0]];
  /** @type {[[number, number], [number, number]]} */
  #vertCoord = [[0, 0], [0, 0]];

  /**
   * @param {number} axisLength 
   * @param {OffscreenCanvas} canvas 
   * @param {number} cellSize 
   * @param {number} height 
   * @param {number} width 
   */
  constructor(axisLength, canvas, cellSize, height, width) {
    this.#axisLength = axisLength;
    this.#canvas = canvas;
    this.#cellSize = cellSize;
    this.#canvasLength = this.#cellSize * this.#axisLength;
    this.#ctx = /** @type {OffscreenCanvasRenderingContext2D} */ (this.#canvas.getContext('2d', { alpha: true }));
    this.setDimensions(height, width);
  }

  /**
   * @param {Generator<[number, number, number], void>} cellsIter 
   */
  draw(cellsIter) {
    const start = performance.now();
    const { height, width } = this.#canvas;
    this.#ctx.clearRect(0, 0, width, height);
    this.#drawGrid();
    for (const [x, y, colour] of cellsIter) {
      this.#fillCell(x, y, colour);
    }
    const dur = performance.now() - start;
    console.log('%cDRAW', 'background: green; color: white', dur);
  }

  /**
   * @param {number} x 
   * @param {number} y 
   * @param {number} colour 
   */
  drawCell(x, y, colour) {
    this.#ctx.strokeStyle = STROKE_STYLE;
    this.#ctx.lineWidth = GRID_LINE_WIDTH;
    this.#ctx.strokeRect(
      x * this.#cellSize + GRID_LINE_WIDTH + this.#offset.x,
      y * this.#cellSize + GRID_LINE_WIDTH + this.#offset.y,
      this.#cellSize - GRID_LINE_WIDTH,
      this.#cellSize - GRID_LINE_WIDTH
    );
    this.#fillCell(x, y, colour);
  }

  /**
   * @param {number} x 
   * @param {number} y 
   */
  incrementOffset(x, y) {
    let ox = this.#offset.x + x;
    if (Math.abs(ox) >= this.#canvasLength) {
      ox = Math.sign(ox) * (Math.abs(ox) - this.#canvasLength);
    }
    this.#offset.x = ox;
    let oy = this.#offset.y + y;
    if (Math.abs(oy) >= this.#canvasLength) {
      oy = Math.sign(oy) * (Math.abs(oy) - this.#canvasLength);
    }
    this.#offset.y = oy;
  }

  /**
   * @param {number} px 
   * @param {number} py 
   * @returns {[number, number]}
   */
  pixelToCellCoord(px, py) {
    return [
      Math.floor((px - this.#offset.x) / this.#cellSize),
      Math.floor((py - this.#offset.y) / this.#cellSize)
    ];
  }

  /**
   * @param {number} h 
   * @param {number} w 
   */
  setDimensions(h, w) {
    this.#canvas.height = h;
    this.#canvas.width = w;
  }

  #drawGrid() {
    this.#ctx.beginPath();

    let x = this.#offset.x % this.#cellSize;
    while (x <= this.#canvasLength) {
      this.#ctx.moveTo(x + GRID_LINE_WIDTH, 0);
      this.#ctx.lineTo(x + GRID_LINE_WIDTH, this.#canvasLength);
      x += this.#cellSize;
    }

    let y = this.#offset.y % this.#cellSize;
    while (y <= this.#canvasLength) {
      this.#ctx.moveTo(0, y + GRID_LINE_WIDTH);
      this.#ctx.lineTo(this.#canvasLength, y + GRID_LINE_WIDTH);
      y += this.#cellSize;
    }

    this.#ctx.strokeStyle = STROKE_STYLE;
    this.#ctx.lineWidth = GRID_LINE_WIDTH;
    this.#ctx.stroke();
  }

  /**
   * @param {number} x 
   * @param {number} y 
   * @param {number} colour 
   */
  #fillCell(x, y, colour) {
    const r = (colour >> 16) & 0xff;
    const g = (colour >> 8) & 0xff;
    const b = colour & 0xff;
    this.#ctx.fillStyle = `rgb(${r},${g},${b})`;

    x = x * this.#cellSize + this.#offset.x;
    y = y * this.#cellSize + this.#offset.y;

    let horizLen = 0;
    const xEnd = x + this.#cellSize;
    if (x < 0 && xEnd > 0) {
      this.#horizCoord[0][0] = 0;
      this.#horizCoord[0][1] = xEnd;
      this.#horizCoord[1][0] = this.#canvasLength + x + GRID_LINE_WIDTH;
      this.#horizCoord[1][1] = -x;
      horizLen = 2;
    } else if (x < 0 && xEnd <= 0) {
      x += this.#canvasLength;
    } else if (x >= this.#canvasLength) {
      x -= this.#canvasLength;
    } else if (xEnd >= this.#canvasLength) {
      const leftWidth = this.#canvasLength - x;
      this.#horizCoord[0][0] = x + GRID_LINE_WIDTH;
      this.#horizCoord[0][1] = leftWidth;
      this.#horizCoord[1][0] = 0;
      this.#horizCoord[1][1] = this.#cellSize - leftWidth;
      horizLen = 2;
    }

    if (horizLen === 0) {
      this.#horizCoord[0][0] = x + GRID_LINE_WIDTH;
      this.#horizCoord[0][1] = this.#cellSize - GRID_LINE_WIDTH;
      horizLen = 1;
    }

    let vertLen = 0;
    const yEnd = y + this.#cellSize;
    if (y < 0 && yEnd > 0) {
      this.#vertCoord[0][0] = 0;
      this.#vertCoord[0][1] = yEnd;
      this.#vertCoord[1][0] = this.#canvasLength + y + GRID_LINE_WIDTH;
      this.#vertCoord[1][1] = -y;
      vertLen = 2;
    } else if (y < 0 && yEnd <= 0) {
      y += this.#canvasLength;
    } else if (y >= this.#canvasLength) {
      y -= this.#canvasLength;
    } else if (yEnd >= this.#canvasLength) {
      const topHeight = this.#canvasLength - y;
      this.#vertCoord[0][0] = y + GRID_LINE_WIDTH;
      this.#vertCoord[0][1] = topHeight;
      this.#vertCoord[1][0] = 0;
      this.#vertCoord[1][1] = this.#cellSize - topHeight;
      vertLen = 2;
    }

    if (vertLen === 0) {
      this.#vertCoord[0][0] = y + GRID_LINE_WIDTH;
      this.#vertCoord[0][1] = this.#cellSize - GRID_LINE_WIDTH;
      vertLen = 1;
    }

    for (let h = 0; h < horizLen; h++) {
      const [x, width] = this.#horizCoord[h];
      for (let v = 0; v < vertLen; v++) {
        const [y, height] = this.#vertCoord[v];
        this.#ctx.fillRect(x, y, width, height);
      }
    }
  }
}
export default CanvasDrawer;