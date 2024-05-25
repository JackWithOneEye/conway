class Looper {
  /** @type {() => void} */
  #callback

  #intervalMS = 100;
  #looping = false;

  /** @type {number | undefined} */
  #loopStartedAt;

  /** @type {number | null} */
  #requestId = null;

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
    this.#intervalMS = Math.max(1, value);
  }

  requestAnimation() {
    requestAnimationFrame(this.#callback);
  }

  start() {
    this.#looping = true;
    this.#requestId = requestAnimationFrame(this.#loop);
  }

  stop() {
    this.#looping = false;
    this.#loopStartedAt = undefined;
    if (this.#requestId != null) {
      cancelAnimationFrame(this.#requestId);
      this.#requestId = null;
    }
  }

  /** @param {DOMHighResTimeStamp} time */
  #loop = (time) => {
    if (this.#looping) {
      if (this.#loopStartedAt === undefined) {
        this.#loopStartedAt = time;
      } else {
        const elapsed = time - this.#loopStartedAt;
        if (elapsed >= this.#intervalMS) {
          this.#callback();
          this.#loopStartedAt = time;
        }
      }
    }

    this.#requestId = requestAnimationFrame(this.#loop);
  }
}
export default Looper;