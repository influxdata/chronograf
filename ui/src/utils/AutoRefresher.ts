type func = (...args: any[]) => any

export class AutoRefresher {
  public subscribers: func[] = []

  private intervalID: NodeJS.Timer

  public subscribe(fn: func) {
    this.subscribers = [...this.subscribers, fn]
  }

  public unsubscribe(fn: func) {
    this.subscribers = this.subscribers.filter(f => f !== fn)
  }

  public poll(refreshMs: number) {
    this.clearInterval()

    if (refreshMs) {
      this.intervalID = setInterval(this.refresh, refreshMs)
    }
  }

  public stopPolling() {
    this.clearInterval()
  }

  private clearInterval() {
    if (!this.intervalID) {
      return
    }

    clearInterval(this.intervalID)
    this.intervalID = null
  }

  private refresh = () => {
    this.subscribers.forEach(fn => fn())
  }
}

// A global singleton, intended to be configured (via `AutoRefresher#poll`) at
// a page level and consumed arbitrarily deep within the page's render tree
// (usually in a `TimeSeries` component)
export const GlobalAutoRefresher = new AutoRefresher()
