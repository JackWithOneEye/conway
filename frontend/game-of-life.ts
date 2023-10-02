import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('game-of-life')
export class GameOfLife extends LitElement {

  @property({ type: Number, attribute: 'cell-size' })
  cellSize = 50;

  @property({ type: Number, attribute: 'cell-colour' })
  cellColour = 0;

  @property({ type: Number })
  speed = 66.67;

  @state()
  private cellColourHex = '#000000';

  @state()
  private playing = false;

  constructor() {
    super();
    this.onWrapperResize = this.onWrapperResize.bind(this);
  }

  protected createRenderRoot() {
    return this;
  }

  protected firstUpdated() {
    const canvas = this.querySelector('canvas')!;

    const seedInput = document.querySelector('#seed-input') as HTMLInputElement;
    const dataSeed = seedInput.value;
    const seed = [];
    if (dataSeed) {
      for (const d of dataSeed.split(',')) {
        seed.push(parseInt(d, 16));
      }
    }

    const offscreen = canvas.transferControlToOffscreen();
    canvasWorkerMessage({
      canvas: offscreen,
      cellSize: this.cellSize,
      speed: this.speed,
      seed,
      type: 'init'
    }, [offscreen]);

    const resObs = new ResizeObserver(this.onWrapperResize);
    resObs.observe(this.querySelector('#canvas-wrapper')!);
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('cellSize')) {
      canvasWorkerMessage({ value: this.cellSize, type: 'cellSizeChange' });
    }

    if (changedProperties.has('speed')) {
      canvasWorkerMessage({ value: this.speed, type: 'speedChange' });
    }

    if (changedProperties.has('playing')) {
      canvasWorkerMessage({ command: this.playing ? 'play' : 'stop', type: 'control' });
    }
  }

  protected render() {
    return html`
      <div class="flex justify-end gap-2 p-2">
        <!-- cell size -->
        <div class="flex items-center gap-1 flex-1">
          <label for="cell-size">Cell Size</label>
          <input
            id="cell-size"
            type="range"
            min="1"
            value=${this.cellSize}
            @input=${this.onCellSizeChange}
          />
          <span>${this.cellSize}</span>
        </div>
        <!-- cell colour -->
        <div class="flex items-center gap-1 flex-1">
          <label for="cell-colour">Cell Colour</label>
          <input 
            id="cell-colour"
            type="color"
            value="${this.cellColourHex}"
            @input=${this.onCellColourChange}
          />
          <span>${this.cellColourHex}</span>
        </div>
        <!-- speed -->
        <div class="flex items-center gap-1">
          <label for="speed">Speed</label>
          <input 
            id="speed"
            type="range"
            value=${Math.pow((1000 - this.speed) * 0.01, 2)}
            @input=${this.onSpeedChange} 
          />
          <span class="w-20">${this.speed.toFixed(0)} ms</span>
        </div>
        <!-- next -->
        <button 
          class="p-1 border border-black active:bg-gray-400 disabled:text-gray-400 disabled:border-gray-400" 
          ?disabled=${this.playing} 
          @click=${this.next}
        >
          NEXT
        </button>
        <!-- play -->
        <button 
          class="p-1 border border-black active:bg-gray-400"
          @click=${() => (this.playing = !this.playing)}
        >
          ${this.playing ? 'PAUSE' : 'PLAY'}
        </button>
      </div>
      <!-- canvas -->
      <div id="canvas-wrapper" class="relative flex-1 p-1 overflow-hidden">
        <canvas class="m-auto" @click=${this.onCanvasClick} width="100" height="100">
          get yourself a new browser
        </canvas>
      </div>
    `
  }

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('cellColour')) {
      this.cellColourHex = `#${this.cellColour.toString(16).padStart(6, '0')}`;
    }
  }

  private next() {
    canvasWorkerMessage({ command: 'next', type: 'control' });
  }

  private onCanvasClick(e: MouseEvent) {
    e.preventDefault();
    canvasWorkerMessage({ x: e.offsetX, y: e.offsetY, colour: this.cellColour, type: 'canvasOnClick' })
  }

  private onCellColourChange({ target }: Event) {
    const val = (target as HTMLInputElement).value;
    this.cellColour = Number(`0x${val.substring(1)}`);
  }

  private onCellSizeChange({ target }: Event) {
    this.cellSize = Number((target as HTMLInputElement).value);
  }

  private onSpeedChange({ target }: Event) {
    const val = Number((target as HTMLInputElement).value);
    this.speed = Math.max(1, 1000 - Math.sqrt(val) * 100);
  }

  private onWrapperResize(entries: ResizeObserverEntry[]) {
    const { height, width } = entries[0].contentRect;
    canvasWorkerMessage({
      height: height - this.cellSize,
      width: width - this.cellSize,
      type: 'resize'
    });
  }
}