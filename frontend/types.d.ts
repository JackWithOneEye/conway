declare type CanvasWorkerMessageData = {
  canvas: OffscreenCanvas;
  cellSize: number;
  type: 'init';
} | {
  height: number;
  width: number;
  type: 'resize';
};

declare type EngineWasmExports = {
  memory: WebAssembly.Memory;
  mallocu32: (length: number) => number;
  next: (input: number, length: number, output: number) => number;
};