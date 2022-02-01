// APIs
import {
  findBuckets,
  findKeys,
  findValues,
  FindKeysOptions,
  FindValuesOptions,
} from './fluxQueries'

// Types
import {CancelBox} from 'src/types/promises'
import {Source} from 'src/types'
import {BuilderTagsType} from '../types'

type CancelableQuery = CancelBox<string[]>

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
    this.findBucketsQuery = pendingResult

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
    tagIndex: number,
    options: FindKeysOptions
  ): Promise<string[]> {
    this.cancelFindKeys(tagIndex)

    const {source, tagsSelections, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
    const cachedResult = this.findKeysCache[cacheKey]

    if (cachedResult) {
      return Promise.resolve([...cachedResult])
    }

    const pendingResult = findKeys(options)

    this.findKeysQueries[tagIndex] = pendingResult

    pendingResult.promise
      .then(result => {
        this.findKeysCache[cacheKey] = result
      })
      .catch(() => {})

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
  ): Promise<string[]> {
    this.cancelFindValues(tagIndex)
    if (!options.key) {
      // return no values for no key
      return []
    }

    const {source, tagsSelections, ...rest} = options
    const cacheKey = JSON.stringify({
      id: source.id,
      tags: tagSelectionKey(tagsSelections),
      ...rest,
    })
    const cachedResult = this.findValuesCache[cacheKey]

    if (cachedResult) {
      return Promise.resolve([...cachedResult])
    }

    const pendingResult = findValues(options)

    this.findValuesQueries[tagIndex] = pendingResult

    pendingResult.promise
      .then(result => {
        this.findValuesCache[cacheKey] = result
      })
      .catch(() => {})

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
