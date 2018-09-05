import {FetchLoop} from 'src/types/logs'

type Predicate = () => boolean

export function fetchUntil<T>(
  predicate: Predicate,
  request: () => Promise<T>
): FetchLoop {
  let isCanceled = false

  const requests = fetchUnless(() => isCanceled || predicate(), request)

  const promise = fetchEachAsync(requests)

  return {
    promise,
    cancel() {
      isCanceled = true
    },
    isCanceled,
  }
}

const fetchEachAsync = async requestsIterator => {
  for (const response of requestsIterator) {
    try {
      console.log('fetchEachAsync')
      await response
    } catch (error) {
      console.error(error)
    }
  }
  console.log('fetchEachAsync FINISHED')
}

function* fetchUnless<T>(
  predicate: Predicate,
  request: () => Promise<T>
): Iterator<Promise<T>> {
  do {
    yield request()
  } while (!predicate())
}
