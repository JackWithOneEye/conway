export declare type CanvasWorkerMessageData = {
  canvas: OffscreenCanvas;
  cellSize: number;
  speed: number;
  type: 'init';
} | {
  height: number;
  width: number;
  type: 'resize';
} | {
  command: 'next' | 'play' | 'stop';
  type: 'control';
} | {
  value: number;
  type: 'cellSizeChange';
} | {
  value: number;
  type: 'speedChange';
} | {
  x: number;
  y: number;
  colour: number;
  type: 'canvasOnClick';
};

export declare type EngineWasmExports = {
  memory: WebAssembly.Memory;
  init: () => number;
  axisLength: () => number;
  calcNextGen: (length: number) => number;
};