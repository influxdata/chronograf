// APIs
import {
  findBuckets,
  findKeys,
  findValues,
  FindKeysOptions,
  FindValuesOptions,
} from './queryBuilder'

// Types
import {CancelBox} from 'src/types/promises'
import {Source} from 'src/types'

type CancelableQuery = CancelBox<string[]>

class QueryBuilderFetcher {
  private findBucketsQuery: CancelableQuery
  private findKeysQueries: {[tagId: string]: CancelableQuery} = {}
  private findValuesQueries: {[tagId: string]: CancelableQuery} = {}
  private findKeysCache: {[key: string]: string[]} = {}
  private findValuesCache: {[key: string]: string[]} = {}
  private findBucketsCache: {[key: string]: string[]} = {}

  public async findBuckets(source: Source): Promise<string[]> {
    this.cancelFindBuckets()

    const cachedResult = this.findBucketsCache[source.id]

    if (cachedResult) {
      return Promise.resolve(cachedResult)
    }

    const pendingResult = findBuckets(source)

    pendingResult.promise
      .then(result => {
        this.findBucketsCache[source.id] = result
      })
      .catch(() => {})

    return pendingResult.promise
  }

  public cancelFindBuckets(): void {
    if (this.findBucketsQuery) {
      this.findBucketsQuery.cancel()
    }
  }

  public async findKeys(
    tagId: string,
    options: FindKeysOptions
  ): Promise<string[]> {
    this.cancelFindKeys(tagId)

    const {source, ...rest} = options
    const cacheKey = source.id + JSON.stringify(rest)
    const cachedResult = this.findKeysCache[cacheKey]

    if (cachedResult) {
      return Promise.resolve(cachedResult)
    }

    const pendingResult = findKeys(options)

    this.findKeysQueries[tagId] = pendingResult

    pendingResult.promise
      .then(result => {
        this.findKeysCache[cacheKey] = result
      })
      .catch(() => {})

    return pendingResult.promise
  }

  public cancelFindKeys(tagId: string): void {
    if (this.findKeysQueries[tagId]) {
      this.findKeysQueries[tagId].cancel()
    }
  }

  public async findValues(
    tagId: string,
    options: FindValuesOptions
  ): Promise<string[]> {
    this.cancelFindValues(tagId)

    const {source, ...rest} = options
    const cacheKey = source.id + JSON.stringify(rest)
    const cachedResult = this.findValuesCache[cacheKey]

    if (cachedResult) {
      return Promise.resolve(cachedResult)
    }

    const pendingResult = findValues(options)

    this.findValuesQueries[tagId] = pendingResult

    pendingResult.promise
      .then(result => {
        this.findValuesCache[cacheKey] = result
      })
      .catch(() => {})

    return pendingResult.promise
  }

  public cancelFindValues(tagId: string): void {
    if (this.findValuesQueries[tagId]) {
      this.findValuesQueries[tagId].cancel()
    }
  }

  public clearCache(): void {
    this.findBucketsCache = {}
    this.findKeysCache = {}
    this.findValuesCache = {}
  }
}

export const queryBuilderFetcher = new QueryBuilderFetcher()
