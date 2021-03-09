type F = (...args: any[]) => any

export interface Debouncer {
  call: (f: F, ms: number) => void
  cancel: (f: F) => void
  cancelAll: () => void
}

class DefaultDebouncer implements Debouncer {
  private timers

  constructor() {
    this.timers = {}
  }

  public call(f: F, ms: number) {
    const key = f.toString()
    const timer = this.timers[key]

    if (timer) {
      clearTimeout(timer)
    }

    this.timers[key] = setTimeout(f, ms)
  }

  public cancel(f: F) {
    const timer = this.timers[f.toString()]

    if (timer) {
      clearTimeout(timer)
    }
  }

  public cancelAll() {
    const timers: number[] = Object.values(this.timers)

    for (const timer of timers) {
      clearTimeout(timer)
    }
  }
}

export default DefaultDebouncer
