import * as api from 'src/shared/apis/annotation'
import {Dispatch} from 'redux'

import {proxy} from 'src/utils/queryUrlGenerator'
import {parseMetaQuery} from 'src/tempVars/parsing'
import {getTagFilters} from 'src/shared/selectors/annotations'
import {getTimeRange} from 'src/dashboards/selectors'
import {BLACKLISTED_KEYS} from 'src/shared/annotations/helpers'
import {millisecondTimeRange} from 'src/dashboards/utils/time'
import {notify} from 'src/shared/actions/notifications'
import {annotationsError} from 'src/shared/copy/notifications'
import {getDeep} from 'src/utils/wrappers'

import {
  Annotation,
  TagFilter,
  AnnotationsDisplaySetting,
} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

export type Action =
  | EditingAnnotationAction
  | DismissEditingAnnotationAction
  | AddingAnnotationAction
  | AddingAnnotationSuccessAction
  | DismissAddingAnnotationAction
  | MouseEnterTempAnnotationAction
  | MouseLeaveTempAnnotationAction
  | SetAnnotationsAction
  | UpdateAnnotationAction
  | SetAddingAnnotationAction
  | DeleteAnnotationAction
  | AddAnnotationAction
  | SetEditingAnnotationAction
  | UpdateTagFilterAction
  | DeleteTagFilterAction
  | SetTagKeysAction
  | SetTagValuesAction
  | SetDisplaySettingAction

interface EditingAnnotationAction {
  type: 'EDITING_ANNOTATION'
}

export const editingAnnotation = (): EditingAnnotationAction => ({
  type: 'EDITING_ANNOTATION',
})

interface DismissEditingAnnotationAction {
  type: 'DISMISS_EDITING_ANNOTATION'
}

export const dismissEditingAnnotation = (): DismissEditingAnnotationAction => ({
  type: 'DISMISS_EDITING_ANNOTATION',
})

interface AddingAnnotationAction {
  type: 'ADDING_ANNOTATION'
}

export const addingAnnotation = (): AddingAnnotationAction => ({
  type: 'ADDING_ANNOTATION',
})

interface AddingAnnotationSuccessAction {
  type: 'ADDING_ANNOTATION_SUCCESS'
}

export const addingAnnotationSuccess = (): AddingAnnotationSuccessAction => ({
  type: 'ADDING_ANNOTATION_SUCCESS',
})

interface DismissAddingAnnotationAction {
  type: 'DISMISS_ADDING_ANNOTATION'
}

export const dismissAddingAnnotation = (): DismissAddingAnnotationAction => ({
  type: 'DISMISS_ADDING_ANNOTATION',
})

interface MouseEnterTempAnnotationAction {
  type: 'MOUSEENTER_TEMP_ANNOTATION'
}

export const mouseEnterTempAnnotation = (): MouseEnterTempAnnotationAction => ({
  type: 'MOUSEENTER_TEMP_ANNOTATION',
})

interface MouseLeaveTempAnnotationAction {
  type: 'MOUSELEAVE_TEMP_ANNOTATION'
}

export const mouseLeaveTempAnnotation = (): MouseLeaveTempAnnotationAction => ({
  type: 'MOUSELEAVE_TEMP_ANNOTATION',
})

interface SetAnnotationsAction {
  type: 'SET_ANNOTATIONS'
  payload: {
    annotations: Annotation[]
  }
}

export const setAnnotations = (
  annotations: Annotation[]
): SetAnnotationsAction => ({
  type: 'SET_ANNOTATIONS',
  payload: {
    annotations,
  },
})

interface UpdateAnnotationAction {
  type: 'UPDATE_ANNOTATION'
  payload: {
    annotation: Annotation
  }
}

export const updateAnnotation = (
  annotation: Annotation
): UpdateAnnotationAction => ({
  type: 'UPDATE_ANNOTATION',
  payload: {
    annotation,
  },
})

interface SetAddingAnnotationAction {
  type: 'SET_ADDING_ANNOTATION'
  payload: Annotation | null
}

export const setAddingAnnotation = (
  annotation: Annotation | null
): SetAddingAnnotationAction => ({
  type: 'SET_ADDING_ANNOTATION',
  payload: annotation,
})

interface DeleteAnnotationAction {
  type: 'DELETE_ANNOTATION'
  payload: {
    annotation: Annotation
  }
}

export const deleteAnnotation = (
  annotation: Annotation
): DeleteAnnotationAction => ({
  type: 'DELETE_ANNOTATION',
  payload: {
    annotation,
  },
})

interface AddAnnotationAction {
  type: 'ADD_ANNOTATION'
  payload: {
    annotation: Annotation
  }
}

export const addAnnotation = (annotation: Annotation): AddAnnotationAction => ({
  type: 'ADD_ANNOTATION',
  payload: {
    annotation,
  },
})

interface SetEditingAnnotationAction {
  type: 'SET_EDITING_ANNOTATION'
  payload: string | null
}

export const setEditingAnnotation = (
  id: string | null
): SetEditingAnnotationAction => ({
  type: 'SET_EDITING_ANNOTATION',
  payload: id,
})

interface UpdateTagFilterAction {
  type: 'UPDATE_TAG_FILTER'
  payload: {
    dashboardID: number
    tagFilter: TagFilter
  }
}

export const updateTagFilter = (
  dashboardID: number,
  tagFilter: TagFilter
): UpdateTagFilterAction => ({
  type: 'UPDATE_TAG_FILTER',
  payload: {dashboardID, tagFilter},
})

interface DeleteTagFilterAction {
  type: 'DELETE_TAG_FILTER'
  payload: {
    dashboardID: number
    tagFilter: TagFilter
  }
}

export const deleteTagFilter = (
  dashboardID: number,
  tagFilter: TagFilter
): DeleteTagFilterAction => ({
  type: 'DELETE_TAG_FILTER',
  payload: {dashboardID, tagFilter},
})

interface SetTagKeysAction {
  type: 'SET_TAG_KEYS'
  payload: string[]
}

export const setTagKeys = (tagKeys: string[]): SetTagKeysAction => ({
  type: 'SET_TAG_KEYS',
  payload: tagKeys,
})

interface SetTagValuesAction {
  type: 'SET_TAG_VALUES'
  payload: {
    tagKey: string
    tagValues: string[]
  }
}

export const setTagValues = (
  tagKey: string,
  tagValues: string[]
): SetTagValuesAction => ({
  type: 'SET_TAG_VALUES',
  payload: {tagKey, tagValues},
})

interface SetDisplaySettingAction {
  type: 'SET_DISPLAY_SETTING'
  payload: AnnotationsDisplaySetting
}

export const setDisplaySetting = (
  setting: AnnotationsDisplaySetting
): SetDisplaySettingAction => ({
  type: 'SET_DISPLAY_SETTING',
  payload: setting,
})

export const addAnnotationAsync = (
  createUrl: string,
  annotation: Annotation
) => async dispatch => {
  dispatch(addAnnotation(annotation))

  try {
    const savedAnnotation = await api.createAnnotation(createUrl, annotation)

    dispatch(deleteAnnotation(annotation))
    dispatch(addAnnotation(savedAnnotation))
  } catch {
    dispatch(deleteAnnotation(annotation))
    dispatch(notify(annotationsError('Error saving annotation')))
  }
}

export const getAnnotationsAsync = (
  indexUrl: string,
  dashboardID: number
) => async (
  dispatch: Dispatch<SetAnnotationsAction>,
  getState
): Promise<void> => {
  const {displaySetting} = getState().annotations

  if (displaySetting === AnnotationsDisplaySetting.HideAnnotations) {
    return
  }

  const timeRange = getTimeRange(getState(), dashboardID)
  const {since, until} = millisecondTimeRange(timeRange)
  const tagFilters = getTagFilters(getState(), dashboardID)

  const annotations = await api.getAnnotations(
    indexUrl,
    since,
    until,
    tagFilters
  )

  dispatch(setAnnotations(annotations))
}

export const deleteAnnotationAsync = (
  annotation: Annotation
) => async dispatch => {
  try {
    dispatch(deleteAnnotation(annotation))
    await api.deleteAnnotation(annotation)
  } catch {
    dispatch(notify(annotationsError('Error deleting annotation')))
    dispatch(addAnnotation(annotation))
  }
}

export const updateAnnotationAsync = (
  annotation: Annotation
) => async dispatch => {
  try {
    await api.updateAnnotation(annotation)
    dispatch(updateAnnotation(annotation))
  } catch {
    dispatch(notify(annotationsError('Error saving annotation')))
  }
}

export const updateTagFilterAsync = (
  indexURL: string,
  dashboardID: number,
  tagFilter: TagFilter
) => async (dispatch, getState) => {
  const state: AnnotationState = getState().annotations
  const currentTagFilter: TagFilter | null = getDeep(
    state,
    `${dashboardID}.${tagFilter.id}`,
    null
  )
  const isNew = !currentTagFilter

  try {
    dispatch(updateTagFilter(dashboardID, tagFilter))
    await dispatch(getAnnotationsAsync(indexURL, dashboardID))
  } catch {
    dispatch(notify(annotationsError('Error saving tag filter')))

    if (isNew) {
      dispatch(deleteTagFilter(dashboardID, tagFilter))
    } else {
      dispatch(updateTagFilter(dashboardID, currentTagFilter))
    }
  }
}

export const deleteTagFilterAsync = (
  indexURL: string,
  dashboardID: number,
  tagFilter: TagFilter
) => async dispatch => {
  try {
    dispatch(deleteTagFilter(dashboardID, tagFilter))
    await dispatch(getAnnotationsAsync(indexURL, dashboardID))
  } catch {
    dispatch(updateTagFilter(dashboardID, tagFilter))
    dispatch(notify(annotationsError('Error deleting tag filter')))
  }
}

export const fetchAndSetTagKeys = (source: string) => async dispatch => {
  const query = 'SHOW TAG KEYS ON chronograf FROM annotations'
  const resp = await proxy({query, source})
  const tagKeys = parseMetaQuery(query, resp.data).filter(
    keys => !BLACKLISTED_KEYS.includes(keys)
  )

  dispatch(setTagKeys(tagKeys))
}

export const fetchAndSetTagValues = (
  source: string,
  tagKey: string
) => async dispatch => {
  const query = `SHOW TAG VALUES ON chronograf FROM annotations WITH KEY = "${tagKey}"`
  const resp = await proxy({query, source})
  const tagValues = parseMetaQuery(query, resp.data)

  dispatch(setTagValues(tagKey, tagValues))
}
