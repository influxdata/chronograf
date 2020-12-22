import {fetchUntil} from 'src/logs/utils/fetchUntil'
import {FetchLoop} from 'src/types/logs'

interface ChunkParams {
  getCurrentSize: () => number
  chunkSize: number
  maxFetchCount: number
  maxNoChangeFetchCount: number
}

export const fetchChunk = <T>(
  request: () => Promise<T>,
  chunkParams: ChunkParams
): FetchLoop => {
  const {
    getCurrentSize,
    maxFetchCount,
    maxNoChangeFetchCount,
    chunkSize,
  } = chunkParams
  const initialSize = getCurrentSize()
  const fetchCount = fetchCounter()
  let lastSize = initialSize

  const isDone = () => {
    const size = getCurrentSize()
    const cycle = fetchCount.next().value as number
    const isChunkLoaded = size - initialSize >= chunkSize
    const isCountMaxed = cycle > maxFetchCount
    if ((cycle + 1) % maxNoChangeFetchCount === 0) {
      if (lastSize - size > 0) {
        lastSize = size
      }
      return true
    }

    return isChunkLoaded || isCountMaxed
  }

  return fetchUntil(isDone, request)
}

function* fetchCounter() {
  let count = 0

  while (true) {
    yield count++
  }
}
