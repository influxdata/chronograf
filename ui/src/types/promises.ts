export interface WrappedCancelablePromise<T> {
  promise: Promise<T>
  cancel: () => void
}
export interface CancelBox<T> extends WrappedCancelablePromise<T> {
  id?: string
}

export function isCancellationError(e: Error) {
  return e?.name === 'CancellationError'
}

export class CancellationError extends Error {
  constructor(...args: any[]) {
    super(...args)

    this.name = 'CancellationError'
  }
}
