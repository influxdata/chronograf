import {createSelector} from 'reselect'

import {
  Annotation,
  TagFilterType,
  AnnotationsDisplaySetting,
} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

const getAnnotationsById = (state: {annotations: AnnotationState}) =>
  state.annotations.annotations

const getDisplaySetting = (state: {annotations: AnnotationState}) =>
  state.annotations.displaySetting

export const getSelectedAnnotations = createSelector(
  getAnnotationsById,
  getDisplaySetting,
  (annotationsById, displaySetting) => {
    if (displaySetting === AnnotationsDisplaySetting.HideAnnotations) {
      return []
    }

    return Object.values<Annotation>(annotationsById).filter(a => !!a)
  }
)

const getTagFiltersById = (
  state: {annotations: AnnotationState},
  dashboardID: number
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
    return tagFilters.filter(t => t.filterType === TagFilterType.Equals).reduce(
      (acc, t) => ({
        ...acc,
        [t.tagKey]: t.tagValue,
      }),
      {}
    )
  }
)
