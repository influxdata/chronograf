import {createSelector} from 'reselect'

import {
  Annotation,
  TagFilterType,
  AnnotationsDisplaySetting,
} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'
interface AnnotationsStateShape {
  app: {persisted: {annotationsDisplaySetting: AnnotationsDisplaySetting}}
  annotations: AnnotationState
}

const getAnnotationsById = (state: AnnotationsStateShape) =>
  state.annotations.annotations

const getDisplaySetting = (state: AnnotationsStateShape) =>
  state.app.persisted.annotationsDisplaySetting

export const getSelectedAnnotations = createSelector(
  getAnnotationsById,
  getDisplaySetting,
  (annotationsById, annotationsDisplaySetting) => {
    if (
      annotationsDisplaySetting === AnnotationsDisplaySetting.HideAnnotations
    ) {
      return []
    }

    return Object.values<Annotation>(annotationsById).filter(a => !!a)
  }
)

const getTagFiltersById = (
  state: {annotations: AnnotationState},
  dashboardID: string
) => state.annotations.tagFilters[dashboardID]

export const getTagFilters = createSelector(
  getTagFiltersById,
  tagFiltersById => {
    return Object.values(tagFiltersById || {}).filter(v => !!v)
  }
)

export const getTagsFromTagFilters = createSelector(
  getTagFilters,
  tagFilters => {
    return tagFilters
      .filter(t => t.filterType === TagFilterType.Equals)
      .reduce(
        (acc, t) => ({
          ...acc,
          [t.tagKey]: t.tagValue,
        }),
        {}
      )
  }
)
