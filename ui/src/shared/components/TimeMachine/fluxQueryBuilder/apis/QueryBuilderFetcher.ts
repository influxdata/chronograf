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
import {BuilderTagsType} from '../types'

type CancelableQuery = CancelBox<string[]>

function tagSelectionKey(tags: BuilderTagsType[]): any[] {
  return tags.map(x => ({
    k: x.key || '',
    v: x.values || [],
    t: x.aggregateFunctionType,
  }))
}
class QueryBuilderFetcher {
  private findBucketsQuery?: CancelableQuery
  private findKeysQueries: {[tagId: string]: CancelableQuery | undefined} = {}
  private findValuesQueries: {[tagId: string]: CancelableQuery | undefined} = {}
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
      this.findBucketsQuery = undefined
    }
  }

  public async findKeys(
    tagId: string,
    options: FindKeysOptions
  ): Promise<string[]> {
    this.cancelFindKeys(tagId)

    const {source, tagsSelections, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
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
      this.findKeysQueries[tagId] = undefined
    }
  }

  public async findValues(
    tagId: string,
    options: FindValuesOptions
  ): Promise<string[]> {
    this.cancelFindValues(tagId)

    const {source, tagsSelections, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
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
      this.findValuesQueries[tagId] = undefined
    }
  }

  public clearCache(): void {
    this.cancelFindBuckets()
    Object.keys(this.findKeysQueries).forEach(x => this.cancelFindKeys(x))
    Object.keys(this.findValuesQueries).forEach(x => this.cancelFindValues(x))
    this.findBucketsCache = {}
    this.findKeysCache = {}
    this.findValuesCache = {}
  }
}

export const queryBuilderFetcher = new QueryBuilderFetcher()
