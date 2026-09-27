/**
 * Bounded FIFO work queue. At most `concurrency` jobs run at once and at most
 * `maxPending` wait behind them; anything beyond that is rejected so a burst of
 * submissions cannot grow memory without bound.
 */
export default class JobQueue {
  constructor({ concurrency, maxPending }) {
    this.concurrency = concurrency;
    this.maxPending = maxPending;
    this.active = 0;
    this.pending = [];
  }

  get stats() {
    return { active: this.active, pending: this.pending.length, concurrency: this.concurrency };
  }

  push(task) {
    if (this.pending.length >= this.maxPending) {
      const error = new Error('Judge queue is full, please retry shortly');
      error.status = 503;
      return Promise.reject(error);
    }
    return new Promise((resolve, reject) => {
      this.pending.push({ task, resolve, reject });
      this.#next();
    });
  }

  #next() {
    if (this.active >= this.concurrency || this.pending.length === 0) return;
    const { task, resolve, reject } = this.pending.shift();
    this.active += 1;
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        this.active -= 1;
        this.#next();
      });
  }
}
