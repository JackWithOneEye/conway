import wasm from '../wasmend/engine.wasm';

// Basic byte unit of WASM heap. (16 bit = 2 bytes)
const BYTES_PER_UNIT = Uint16Array.BYTES_PER_ELEMENT;
const BUFFER_LENGTH = 32 * Uint32Array.BYTES_PER_ELEMENT;

class HeapBuffer {
  /**
   * @param {number} ptr 
   * @param {WebAssembly.Memory} memory 
   */
  constructor(ptr, memory) {
    /** @type {number} */
    this.ptr = ptr;
    /** @type {Uint32Array} */
    this.buffer = new Uint32Array(memory.buffer).subarray(
      ptr >> BYTES_PER_UNIT,
      (ptr + BUFFER_LENGTH) >> BYTES_PER_UNIT
    );
  }

  /**
   * @param {Uint32Array} buffer 
   */
  set(buffer) {
    this.buffer.set(buffer);
  }
}

class Engine {
  /**
   * @param {number[]} initialState 
   */
  constructor(initialState) {
    /** @type {WebAssembly.Module} @private */
    this.module = new WebAssembly.Module(wasm);
    /** @type {WebAssembly.Instance} @private */
    this.instance = new WebAssembly.Instance(this.module);

    /** @type {EngineWasmExports} @private */
    const { memory, next, mallocu32 } = this.instance.exports;
    /** @type {WebAssembly.Memory} @private */
    this.memory = memory;


    /** @type {HeapBuffer} @private */
    this.inputBuffer = new HeapBuffer(mallocu32(BUFFER_LENGTH), this.memory);
    /** @type {HeapBuffer} @private */
    this.outputBuffer = new HeapBuffer(mallocu32(BUFFER_LENGTH), this.memory);
    this.computeNextGen = () => {
      this.inputBuffer.set(this.outputBuffer.buffer);
      this.numAliveCells = next(this.inputBuffer.ptr, this.numAliveCells, this.outputBuffer.ptr);
    };

    /** @type {number} @private */
    this.numAliveCells = initialState.length;
    const initBuf = new Uint32Array(initialState);
    this.inputBuffer.set(initBuf);
    this.outputBuffer.set(initBuf);

    /** @type {[number, number]} */
    this.coordinate = new Array(2);
  }

  *aliveCells() {
    for (let i = 0; i < this.numAliveCells; i++) {
      const v = this.outputBuffer.buffer[i]
      this.coordinate[0] = v >> 16;
      this.coordinate[1] = v & 0x00ff;
      yield this.coordinate;
    }
  }
}

export default Engine;