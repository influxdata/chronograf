// APIs
import {
  findBuckets,
  findKeys,
  findValues,
  FindKeysOptions,
  FindValuesOptions,
  TruncatedResult,
  FindBucketsOptions,
} from './fluxQueries'

// Types
import {CancelBox} from 'src/types/promises'
import {Source} from 'src/types'
import {BuilderTagsType} from '../types'

type CancelableQuery = CancelBox<string[] | TruncatedResult<string[]>>

function tagSelectionKey(tags: BuilderTagsType[]): any[] {
  return tags.map(x => ({
    k: x.tagKey || '',
    v: x.tagValues || [],
    t: x.aggregateFunctionType,
  }))
}
class QueryBuilderFetcher {
  private findBucketsQuery?: CancelableQuery
  private findKeysQueries: Array<CancelableQuery | undefined> = []
  private findValuesQueries: Array<CancelableQuery | undefined> = []
  private findKeysCache: {
    [key: string]: TruncatedResult<string[]> & {limit: number}
  } = {}
  private findValuesCache: {
    [key: string]: TruncatedResult<string[]> & {limit: number}
  } = {}
  private findBucketsCache: {
    [key: string]: TruncatedResult<string[]> & {limit: number}
  } = {}

  public async findBuckets(
    source: Source,
    options: FindBucketsOptions = {limit: Number.MAX_SAFE_INTEGER}
  ): Promise<TruncatedResult<string[]>> {
    this.cancelFindBuckets()

    const cacheKey = source.id
    const cachedResult = this.findBucketsCache[cacheKey]

    if (cachedResult && options.limit <= cachedResult.limit) {
      return Promise.resolve({
        result: cachedResult.result,
        truncated: cachedResult.truncated,
      })
    }

    const pendingResult = findBuckets(source, options)
    this.findBucketsQuery = pendingResult

    pendingResult.promise
      .then(t => {
        this.findBucketsCache[cacheKey] = {
          result: t.result,
          truncated: t.truncated,
          limit: options.limit,
        }
      })
      .catch(() => {})

    return pendingResult.promise
  }

  public cancelFindBuckets(): void {
    if (this.findBucketsQuery) {
      this.findBucketsQuery.cancel()
      this.findBucketsQuery = undefined
    }
  }

  public async findKeys(
    tagIndex: number,
    options: FindKeysOptions
  ): Promise<TruncatedResult<string[]>> {
    this.cancelFindKeys(tagIndex)

    const {source, tagsSelections, limit, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
    const cachedResult = this.findKeysCache[cacheKey]

    if (cachedResult && limit <= cachedResult.limit) {
      return Promise.resolve({
        result: [...cachedResult.result],
        truncated: cachedResult.truncated,
      })
    }

    const pendingResult = findKeys(options)

    this.findKeysQueries[tagIndex] = pendingResult

    pendingResult.promise = pendingResult.promise.then(t => {
      this.findKeysCache[cacheKey] = {
        result: [...t.result],
        truncated: t.truncated,
        limit,
      }
      return t
    })

    return pendingResult.promise
  }

  public cancelFindKeys(tagIndex: number): void {
    if (this.findKeysQueries[tagIndex]) {
      this.findKeysQueries[tagIndex].cancel()
      this.findKeysQueries[tagIndex] = undefined
    }
  }

  public async findValues(
    tagIndex: number,
    options: FindValuesOptions
  ): Promise<TruncatedResult<string[]>> {
    this.cancelFindValues(tagIndex)
    if (!options.key) {
      // return no values for no key
      return {result: [], truncated: false}
    }

    const {source, tagsSelections, limit, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
    const cachedResult = this.findValuesCache[cacheKey]

    if (cachedResult && limit <= cachedResult.limit) {
      return Promise.resolve({
        result: [...cachedResult.result],
        truncated: cachedResult.truncated,
      })
    }

    const pendingResult = findValues(options)

    this.findValuesQueries[tagIndex] = pendingResult

    pendingResult.promise = pendingResult.promise.then(t => {
      this.findValuesCache[cacheKey] = {
        result: [...t.result],
        truncated: t.truncated,
        limit,
      }
      return t
    })

    return pendingResult.promise
  }

  public cancelFindValues(tagIndex: number): void {
    if (this.findValuesQueries[tagIndex]) {
      this.findValuesQueries[tagIndex].cancel()
      this.findValuesQueries[tagIndex] = undefined
    }
  }

  public cancelPendingQueries(): void {
    this.cancelFindBuckets()
    this.findKeysQueries.forEach((_, i) => this.cancelFindKeys(i))
    this.findKeysQueries = []
    this.findValuesQueries.forEach((_, i) => this.cancelFindValues(i))
    this.findValuesQueries = []
  }

  public clearCache(): void {
    this.cancelPendingQueries()
    this.findBucketsCache = {}
    this.findKeysCache = {}
    this.findValuesCache = {}
  }
}

const queryBuilderFetcher = new QueryBuilderFetcher()
export default queryBuilderFetcher
