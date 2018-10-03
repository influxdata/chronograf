import Deferred from 'src/worker/Deferred'

class Restarter {
  private deferred?: Deferred
  private id: number = 0

  public perform<T>(promise: Promise<T>): Promise<T> {
    if (!this.deferred) {
      this.deferred = new Deferred()
    }

    this.id += 1
    this.awaitResult(promise, this.id)

    return this.deferred.promise
  }

  private awaitResult = async (promise: Promise<any>, id: number) => {
    let result
    let shouldReject = false

    try {
      result = await promise
    } catch (error) {
      result = error
      shouldReject = true
    }

    if (id !== this.id) {
      return
    }

    if (shouldReject) {
      this.deferred.reject(result)
    } else {
      this.deferred.resolve(result)
    }

    this.deferred = null
  }
}

export default Restarter
