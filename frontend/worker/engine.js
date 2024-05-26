// @ts-ignore
import wasm from '../../wasmend/engine.wasm';

// Basic byte unit of WASM heap
const BYTES_PER_UNIT = Uint16Array.BYTES_PER_ELEMENT;

class Engine {
  /** @type {number} @readonly */
  axisLength;

  /** @type {Uint32Array} */
  #outputBuffer;

  #coordinate = /** @type {[number,number,number]} */(new Array(3));

  /** @type {import('../types').EngineWasmExports['calcNextGen']} */
  #calcNextGenFn;
  #numAliveCells = 0;

  constructor() {
    const module = new WebAssembly.Module(wasm);
    const instance = new WebAssembly.Instance(module, {
      env: {
        /** @param {unknown} v */
        consoleLog: (v) => {
          console.log('ZIG!', v)
        }
      }
    });
    const { memory, axisLength, calcNextGen, init } = /** @type {import('../types').EngineWasmExports} */ (instance.exports);

    const ptr = init() >>> 0;
    this.axisLength = axisLength();
    const bufferLength = (this.axisLength * this.axisLength) << 1;
    this.#outputBuffer = new Uint32Array(memory.buffer).subarray(
      ptr >> BYTES_PER_UNIT,
      (ptr + bufferLength) >> BYTES_PER_UNIT
    );

    this.#calcNextGenFn = calcNextGen;
  }

  *aliveCells() {
    for (let i = 0; i < this.#numAliveCells * 2; i += 2) {
      const coord = this.#outputBuffer[i];
      const colour = this.#outputBuffer[i + 1];
      this.#coordinate[0] = (coord >> 16) & 0xffff;
      this.#coordinate[1] = coord & 0xffff;
      this.#coordinate[2] = colour;
      yield this.#coordinate;
    }
  }

  calcNextGen() {
    const start = performance.now();
    this.#numAliveCells = this.#calcNextGenFn(this.#numAliveCells);
    const dur = performance.now() - start;
    console.log('%cCALC', 'background: green; color: white', dur);
  }

  /**
   * @param {number} x 
   * @param {number} y 
   */
  canSetAliveCell(x, y) {
    x &= (this.axisLength - 1);
    y &= (this.axisLength - 1);
    const coord = x << 16 | y;
    for (let i = 0; i < this.#outputBuffer.length; i++) {
      if (!(i & 1) && this.#outputBuffer[i] === coord) {
        return false;
      }
    }
    return true;
  }

  clear() {
    this.#numAliveCells = 0;
    for (let i = 0; i < this.#outputBuffer.length; i++) {
      this.#outputBuffer[i] = 0;
    }
  }

  readSeed() {
    return [...this.#outputBuffer.subarray(0, this.#numAliveCells << 1)];
  }

  /**
   * @param {number} x 
   * @param {number} y 
   * @param {number} colour 
   * @param {boolean} [noCheck=false] 
   */
  setAliveCell(x, y, colour, noCheck = false) {
    x &= (this.axisLength - 1);
    y &= (this.axisLength - 1);
    const coord = x << 16 | y;
    const maxIdx = this.#numAliveCells << 1;
    if (!noCheck) {
      let idx = -1;
      for (let i = 0; i < this.#outputBuffer.length; i++) {
        if (!(i & 1) && this.#outputBuffer[i] === coord) {
          idx = i;
          break;
        }
      }
      if (idx >= 0 && idx < maxIdx) {
        return false;
      }
    }
    this.#outputBuffer[maxIdx] = coord;
    this.#outputBuffer[maxIdx + 1] = colour;
    this.#numAliveCells += 1;

    return true;
  }

  /**
   * @param {number[]} seed 
   */
  setSeed(seed) {
    this.#numAliveCells = seed.length >> 1;
    const seedBuf = new Uint32Array(seed);
    this.#outputBuffer.set(seedBuf);
  }
}

export default Engine;