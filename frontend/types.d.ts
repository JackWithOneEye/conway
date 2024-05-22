declare global {
  var initCanvasWorker: (msg: CanvasWorkerInitMessage, offscreenCanvas: OffscreenCanvas) => void;
}

export declare type CanvasWorkerInitMessage = {
  canvas: OffscreenCanvas;
  cellSize: number;
  height: number;
  messageBuffer: Int32Array;
  seed: number[];
  speed: number;
  type: 'init';
  width: number;
};

export declare type EngineWasmExports = {
  memory: WebAssembly.Memory;
  init: () => number;
  axisLength: () => number;
  calcNextGen: (length: number) => number;
};