// @ts-expect-error
import wasm from '../../wasmend/engine.wasm';
import { EngineWasmExports } from '../types';

// Basic byte unit of WASM heap
const BYTES_PER_UNIT = Uint16Array.BYTES_PER_ELEMENT;

class Engine {
  readonly axisLength: number;

  private outputBuffer: Uint32Array;

  private coordinate = new Array(2) as [number, number];
  private calcNextGenFn: EngineWasmExports['calcNextGen'];
  private numAliveCells: number;

  constructor(initialState: number[]) {
    const module = new WebAssembly.Module(wasm);
    const instance = new WebAssembly.Instance(module);
    const { memory, axisLength, calcNextGen, init } = instance.exports as EngineWasmExports;

    const ptr = init();
    this.axisLength = axisLength();
    const bufferLength = this.axisLength * this.axisLength;
    this.outputBuffer = new Uint32Array(memory.buffer).subarray(
      ptr >> BYTES_PER_UNIT,
      (ptr + bufferLength) >> BYTES_PER_UNIT
    );

    this.calcNextGenFn = calcNextGen;

    this.numAliveCells = initialState.length;
    const initBuf = new Uint32Array(initialState);
    this.outputBuffer.set(initBuf);
  }

  *aliveCells() {
    for (let i = 0; i < this.numAliveCells; i++) {
      const v = this.outputBuffer[i];
      this.coordinate[0] = v >> 16;
      this.coordinate[1] = v & 0x00ff;
      yield this.coordinate;
    }
  }

  calcNextGen() {
    // const start = performance.now();
    this.numAliveCells = this.calcNextGenFn(this.numAliveCells);
    // const dur = performance.now() - start;
    // console.log('?', dur);
  }

  setAliveCell(x: number, y: number) {
    const coord = x << 16 | y & 0x00ff;
    const idx = this.outputBuffer.indexOf(coord);
    if (idx >= 0 && idx < this.numAliveCells) {
      return;
    }
    this.outputBuffer[this.numAliveCells++] = coord;
  }
}

export default Engine;