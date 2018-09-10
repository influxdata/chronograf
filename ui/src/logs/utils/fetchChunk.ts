import {fetchUntil} from 'src/logs/utils/fetchUntil'
import {FetchLoop} from 'src/types/logs'

interface ChunkParams {
  getCurrentSize: () => number
  chunkSize: number
  maxFetchCount: number
}

export const fetchChunk = <T>(
  request: () => Promise<T>,
  chunkParams: ChunkParams
): FetchLoop => {
  const {getCurrentSize, maxFetchCount, chunkSize} = chunkParams
  const initialSize = getCurrentSize()
  const fetchCount = fetchCounter()

  const isDone = () => {
    const isChunkLoaded = getCurrentSize() - initialSize >= chunkSize
    const isCountMaxed = fetchCount.next().value > maxFetchCount

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
