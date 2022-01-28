export interface WrappedCancelablePromise<T> {
  promise: Promise<T>
  cancel: () => void
}
export interface CancelBox<T> extends WrappedCancelablePromise<T> {
  id?: string
}

export class CancellationError extends Error {
  constructor(...args: any[]) {
    super(...args)

    this.name = 'CancellationError'
  }
}
