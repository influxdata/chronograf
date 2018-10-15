// he is a library for safely encoding and decoding HTML Entities
import he from 'he'
import {Dispatch} from 'redux'

import {fetchJSONFeed as fetchJSONFeedAJAX} from 'src/status/apis'

import {JSONFeedData} from 'src/types'

export enum ActionTypes {
  FETCH_JSON_FEED_REQUESTED = 'FETCH_JSON_FEED_REQUESTED',
  FETCH_JSON_FEED_COMPLETED = 'FETCH_JSON_FEED_COMPLETED',
  FETCH_JSON_FEED_FAILED = 'FETCH_JSON_FEED_FAILED',
}

interface FetchJSONFeedRequestedAction {
  type: ActionTypes.FETCH_JSON_FEED_REQUESTED
}

interface FetchJSONFeedCompletedAction {
  type: ActionTypes.FETCH_JSON_FEED_COMPLETED
  payload: {data: JSONFeedData}
}

interface FetchJSONFeedFailedAction {
  type: ActionTypes.FETCH_JSON_FEED_FAILED
}

export type Action =
  | FetchJSONFeedRequestedAction
  | FetchJSONFeedCompletedAction
  | FetchJSONFeedFailedAction

const fetchJSONFeedRequested = (): FetchJSONFeedRequestedAction => ({
  type: ActionTypes.FETCH_JSON_FEED_REQUESTED,
})

const fetchJSONFeedCompleted = (
  data: JSONFeedData
): FetchJSONFeedCompletedAction => ({
  type: ActionTypes.FETCH_JSON_FEED_COMPLETED,
  payload: {data},
})

const fetchJSONFeedFailed = (): FetchJSONFeedFailedAction => ({
  type: ActionTypes.FETCH_JSON_FEED_FAILED,
})

export const fetchJSONFeedAsync = (url: string) => async (
  dispatch: Dispatch<Action>
): Promise<void> => {
  dispatch(fetchJSONFeedRequested())
  try {
    const data = (await fetchJSONFeedAJAX(url)) as JSONFeedData
    // data could be from a webpage, and thus would be HTML
    if (typeof data === 'string' || !data) {
      dispatch(fetchJSONFeedFailed())
    } else {
      // decode HTML entities from response text
      const decodedData = {
        ...data,
        items: data.items.map(item => {
          item.title = he.decode(item.title)
          item.content_text = he.decode(item.content_text)
          return item
        }),
      }
      dispatch(fetchJSONFeedCompleted(decodedData))
    }
  } catch (error) {
    console.error(error)
    dispatch(fetchJSONFeedFailed())
  }
}
