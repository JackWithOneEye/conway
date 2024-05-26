import { LitElement, html } from 'lit';
import { Command, MessageIndex, MessageType } from './message';
import { MAX_PATTERN_COORDINATES_LEN, Patterns } from './patterns';
import { map } from 'lit/directives/map.js';
import { classMap } from 'lit/directives/class-map.js';

/** 
 * @typedef {'idle' | 'down' | 'dragging'} CanvasMouseState 
 */

class GameOfLife extends LitElement {
  #dragState = { x: 0, y: 0 };
  #dragLeftAt = { x: 0, y: 0 };

  /** @type {import('./patterns').PatternType | null} */
  #draggedType = null

  #messageBuffer = new Int32Array(
    new SharedArrayBuffer(
      (Object.keys(MessageIndex).length + MAX_PATTERN_COORDINATES_LEN) * Int32Array.BYTES_PER_ELEMENT
    )
  );

  static properties = {
    cellSize: { type: Number, attribute: 'cell-size' },
    cellColour: { type: Number, attribute: 'cell-colour' },
    speed: { type: Number },
    _cellColourHex: { state: true },
    _playing: { state: true },
    _canvasMouseState: { state: true },
    _isDragOver: { state: true },
    _patternMenuOpen: { state: true }
  };

  constructor() {
    super();
    this.cellSize = 50;
    this.cellColour = 0;
    this.speed = 66.67;
    /** @private */
    this._cellColourHex = '#000000';
    /** @private */
    this._playing = false;
    /** @type {CanvasMouseState} @private */
    this._canvasMouseState = 'idle';
    /** @private */
    this._isDragOver = false;
    /** @private */
    this._patternMenuOpen = false;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('mouseup', this.#onDocumentMouseUp);
  }

  disconnectedCallback() {
    document.removeEventListener('mouseup', this.#onDocumentMouseUp);
    super.disconnectedCallback();
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    /** @type {HTMLInputElement | null} */
    const seedInput = document.querySelector('#seed-input');
    const dataSeed = seedInput?.value; //'0,0,10001,0,103ff,0,3ff03ff,0,3ff0001,0';
    const seed = [];
    if (dataSeed) {
      for (const d of dataSeed.split(',')) {
        seed.push(parseInt(d, 16));
      }
    }

    const canvas = /** @type {HTMLCanvasElement} */ (this.querySelector('canvas'));
    const offscreen = canvas.transferControlToOffscreen();
    const canvasWrapper = /** @type {HTMLDivElement} */ (this.querySelector('#canvas-wrapper'));

    initCanvasWorker({
      canvas: offscreen,
      cellSize: this.cellSize,
      messageBuffer: this.#messageBuffer,
      seed,
      speed: this.speed,
      height: canvasWrapper.offsetHeight,
      width: canvasWrapper.offsetWidth,
      type: 'init'
    }, offscreen);

    const resObs = new ResizeObserver(this.#onWrapperResize);
    resObs.observe(canvasWrapper);
  }

  /**
   * @param {Map<PropertyKey, unknown>} changedProperties 
   */
  updated(changedProperties) {
    let msgType = 0;

    if (changedProperties.has('cellSize')) {
      msgType |= MessageType.CELL_SIZE_CHANGE;
      this.#messageBuffer[MessageIndex.CELL_SIZE] = this.cellSize;
    }

    if (changedProperties.has('speed')) {
      msgType |= MessageType.SPEED_CHANGE;
      this.#messageBuffer[MessageIndex.SPEED] = this.speed;
    }

    if (changedProperties.has('_playing')) {
      msgType |= MessageType.CONTROL;
      this.#messageBuffer[MessageIndex.CONTROL_CMD] = this._playing ? Command.PLAY : Command.STOP;
    }

    if (msgType > 0) {
      Atomics.store(this.#messageBuffer, MessageIndex.TYPE, msgType);
      Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
      Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
    }
  }

  render() {
    return html`
      <div class="flex flex-wrap justify-between gap-2 p-2">
        <!-- pattern menu toggle -->
        <button 
          class="
            p-1 border border-black active:bg-gray-400
            ${classMap({ 'bg-gray-400': this._patternMenuOpen })}
          "
          @click=${() => this._patternMenuOpen = !this._patternMenuOpen}
        >
          PATTERNS
        </button>
        <button
          class="p-1 border border-black active:bg-gray-400"
          @click=${this.#onClear}
        >
          C
        </button>
        <!-- cell size -->
        <div class="flex items-center gap-1">
          <label for="cell-size">Cell Size</label>
          <input
            id="cell-size"
            type="range"
            min="1"
            value=${this.cellSize}
            @input=${this.#onCellSizeChange}
          />
          <span>${this.cellSize}</span>
        </div>
        <!-- cell colour -->
        <div class="flex items-center gap-1">
          <label for="cell-colour">Cell Colour</label>
          <input 
            id="cell-colour"
            type="color"
            value="${this._cellColourHex}"
            @input=${this.#onCellColourChange}
          />
          <span>${this._cellColourHex}</span>
        </div>
        <!-- speed -->
        <div class="flex items-center gap-1">
          <label for="speed">Speed</label>
          <input 
            id="speed"
            type="range"
            value=${Math.pow((1000 - this.speed) * 0.01, 2)}
            @input=${this.#onSpeedChange} 
          />
          <span class="w-20">${this.speed.toFixed(0)} ms</span>
        </div>
        <div class="flex gap-1">
          <!-- next -->
          <button 
            class="p-1 border border-black active:bg-gray-400 disabled:text-gray-400 disabled:border-gray-400 disabled:pointer-events-none" 
            ?disabled=${this._playing} 
            @click=${this.#next}
          >
            NEXT
          </button>
          <!-- play -->
          <button 
            class="p-1 border border-black active:bg-gray-400"
            @click=${() => (this._playing = !this._playing)}
          >
            ${this._playing ? 'PAUSE' : 'PLAY'}
          </button>
        </div>
      </div>
      <div 
        class="
          flex transition-transform flex-wrap border-2 border-gray-300 gap-2 p-2 mx-1
          ${classMap({ 'hidden': !this._patternMenuOpen, 'transition-none': this._patternMenuOpen })}
        "
      >
        ${map(Object.entries(Patterns), ([type, pattern]) => this.#patternTemplate(pattern, /** @type {import('./patterns').PatternType} */(type)))}
      </div>
      <div class="flex flex-1 p-1 overflow-hidden">
        <div class="w-full p-1 border border-gray-400">
          <!-- canvas -->
          <div id="canvas-wrapper" class="relative h-full">
            <canvas 
              class="data-[dragging]:cursor-grab data-[dragover]:bg-gray-400/10"
              ?data-dragging=${this._canvasMouseState === 'dragging'}
              ?data-dragover=${this._isDragOver}
              @mousedown=${this.#onCanvasMouseDown}
              @mouseleave=${this.#onCanvasMouseLeave}
              @mousemove=${this.#onCanvasMouseMove}
              @mouseup=${this.#onCanvasMouseUp}
              @dragover=${this.#onDragOver}
              @dragleave=${() => this._isDragOver = false}
              @drop=${this.#onDrop}
              width="100"
              height="100"
            >
              get yourself a new browser
            </canvas>
          </div>
        </div>
      </div>
    `
  }

  /**
   * @param {Map<PropertyKey, unknown>} changedProperties 
   */
  willUpdate(changedProperties) {
    if (changedProperties.has('cellColour')) {
      this._cellColourHex = `#${this.cellColour.toString(16).padStart(6, '0')}`;
    }
  }

  #next() {
    this.#messageBuffer[MessageIndex.CONTROL_CMD] = Command.NEXT;
    Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.CONTROL);
    Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
    Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
  }

  /**
   * @param {MouseEvent} e 
   */
  #onCanvasMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    this.#dragState.x = e.x;
    this.#dragState.y = e.y;
    this._canvasMouseState = 'down';
  }

  /**
   * @param {MouseEvent} e 
   */
  #onCanvasMouseLeave({ x, y }) {
    if (this._canvasMouseState === 'dragging') {
      this.#dragLeftAt.x = x;
      this.#dragLeftAt.y = y;
    }
  }

  /**
   * @param {MouseEvent} e
   */
  #onCanvasMouseMove(e) {
    if (this._canvasMouseState !== 'down' && this._canvasMouseState !== 'dragging') {
      return;
    }
    const x = e.x - this.#dragState.x;
    const y = e.y - this.#dragState.y;
    if (this._canvasMouseState === 'dragging' || Math.abs(x) > 5 || Math.abs(y) > 5) {
      this.#messageBuffer[MessageIndex.DRAG_X] = x;
      this.#messageBuffer[MessageIndex.DRAG_Y] = y;
      Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.CANVAS_ON_DRAG);
      Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
      Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
      this.#dragState.x = e.x;
      this.#dragState.y = e.y;
      this._canvasMouseState = 'dragging';
    }
  }

  /**
   * @param {MouseEvent} e
   */
  #onCanvasMouseUp(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this._canvasMouseState === 'down') {
      this.#messageBuffer[MessageIndex.CLICK_X] = e.offsetX;
      this.#messageBuffer[MessageIndex.CLICK_Y] = e.offsetY;
      this.#messageBuffer[MessageIndex.CLICK_COLOUR] = this.cellColour;
      Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.CANVAS_ON_CLICK);
      Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
      Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
    }
    this._canvasMouseState = 'idle';
  }

  /**
   * @param {Event} e 
   */
  #onCellColourChange({ target }) {
    const val = /** @type {HTMLInputElement} */ (target).value;
    this.cellColour = Number(`0x${val.substring(1)}`);
  }

  /**
   * @param {Event} e 
   */
  #onCellSizeChange({ target }) {
    this.cellSize = Number(/** @type {HTMLInputElement} */(target).value);
  }

  #onClear() {
    Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.CLEAR);
    Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
    Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
  }

  #onDocumentMouseUp = () => {
    this._canvasMouseState = 'idle';
  }

  #onDragEnd = () => {
    this.#draggedType = null
    this._isDragOver = false
    document.body.style.userSelect = '';
    document.removeEventListener('drop', this.#onDragEnd)
  }

  /**
   * @param {DragEvent} event 
   */
  #onDragOver(event) {
    event.preventDefault();
    if (!this.#draggedType) {
      return;
    }
    this._isDragOver = true;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * @param {DragEvent} event 
   * @param {import('./patterns').PatternType} type 
   */
  #onDragStart(event, type) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/conway', type)
      event.dataTransfer.effectAllowed = 'move'
    }

    this.#draggedType = type
    document.body.style.userSelect = 'none';

    document.addEventListener('drop', this.#onDragEnd)
  }

  /**
   * @param {DragEvent} event 
   */
  #onDrop(event) {
    const { coordinates } = Patterns[/** @type {import('./patterns').PatternType} */ (this.#draggedType)];

    this.#messageBuffer[MessageIndex.DROP_X] = event.offsetX;
    this.#messageBuffer[MessageIndex.DROP_Y] = event.offsetY;
    this.#messageBuffer[MessageIndex.DROP_COLOUR] = this.cellColour;
    this.#messageBuffer[MessageIndex.DROP_PATTERN_LEN] = coordinates.length;
    this.#messageBuffer.set(coordinates, MessageIndex.DROP_PATTERN);

    Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.CANVAS_ON_DROP);
    Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
    Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
  }

  /**
   * @param {Event} e 
   */
  #onSpeedChange({ target }) {
    const val = Number(/** @type {HTMLInputElement}*/(target).value);
    this.speed = Math.max(1, 1000 - Math.sqrt(val) * 100);
  }

  /**
   * @param {ResizeObserverEntry[]} entries 
   */
  #onWrapperResize = (entries) => {
    const { height, width } = entries[0].contentRect;
    this.#messageBuffer[MessageIndex.RESIZE_HEIGHT] = height;
    this.#messageBuffer[MessageIndex.RESIZE_WIDTH] = width;
    Atomics.store(this.#messageBuffer, MessageIndex.TYPE, MessageType.RESIZE);
    Atomics.store(this.#messageBuffer, MessageIndex.UPDATE, 1);
    Atomics.notify(this.#messageBuffer, MessageIndex.UPDATE);
  }

  /**
   * @param {import('./patterns').Pattern} pattern 
   * @param {import('./patterns').PatternType} type 
   */
  #patternTemplate(pattern, type) {
    return html`
      <div class="p-1 border border-gray-300 cursor-pointer" draggable="true" @dragstart=${(/** @type {DragEvent} */ e) => this.#onDragStart(e, type)}>
        ${pattern.name}
      </div>
    `;
  }
}
customElements.define('game-of-life', GameOfLife);