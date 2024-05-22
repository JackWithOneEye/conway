class Looper {
  #intervalMS = 100;
  #looping = false;

  /** @type {number | null} */
  #timeoutHandle = null;

  /** @type {() => void} */
  #callback

  /**
   * @param {() => void} callback 
   */
  constructor(callback) {
    this.#callback = callback;
  }

  /**
   * @param {number} value
   */
  set speed(value) {
    this.#intervalMS = value;
  }

  start() {
    this.#looping = true;
    this.#loop();
  }

  stop() {
    this.#looping = false;
    if (this.#timeoutHandle != null) {
      clearTimeout(this.#timeoutHandle);
      this.#timeoutHandle = null;
    }
  }

  #loop() {
    if (!this.#looping) {
      return;
    }
    this.#callback();
    this.#timeoutHandle = setTimeout(() => this.#loop(), this.#intervalMS);
  }
}

export default Looper;