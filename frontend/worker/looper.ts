class Looper {
  private intervalMS = 100;
  private looping = false;
  private timeoutHandle: number | null = null;

  constructor(
    private callback: () => void
  ) {
    this.loop = this.loop.bind(this);
  }

  set speed(value: number) {
    this.intervalMS = value;
  }

  start() {
    this.looping = true;
    this.loop();
  }

  stop() {
    this.looping = false;
    if (this.timeoutHandle != null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private loop() {
    if (!this.looping) {
      return;
    }
    this.callback();
    this.timeoutHandle = setTimeout(this.loop, this.intervalMS);
  }
}

export default Looper;