class Deferred {
  public reject: (...args: any[]) => void
  public resolve: (...args: any[]) => void
  public promise: Promise<any>

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

class WebSocketConnection {
  private url: string
  private onMessage: (msg: any) => void
  private ws?: WebSocket
  private opening: Deferred

  constructor(url: string, onMessage: (msg: any) => void) {
    this.url = url
    this.onMessage = onMessage
  }

  public async send(msg) {
    await this.getWebSocket()

    this.ws.send(msg)
  }

  private async getWebSocket(): Promise<WebSocket> {
    const readyState = this.ws ? this.ws.readyState : ''

    if (readyState === WebSocket.OPEN) {
      return this.ws
    }

    if (readyState === WebSocket.CONNECTING) {
      return this.opening.promise
    }

    this.openWebSocket()

    return this.opening.promise
  }

  private async openWebSocket(): Promise<WebSocket> {
    this.opening = new Deferred()
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = this.onMessage
    this.ws.onopen = this.opening.resolve
    this.ws.onerror = (e: any) => {
      throw new Error(`Unknown WebSocket error: ${e}`)
    }

    return this.opening.promise
  }
}

export default WebSocketConnection
