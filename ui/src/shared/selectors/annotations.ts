import {createSelector} from 'reselect'

import {Annotation, TagFilterType} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

const getAnnotationsById = (state: {annotations: AnnotationState}) =>
  state.annotations.annotations

export const getSelectedAnnotations = createSelector(
  getAnnotationsById,
  annotationsById => {
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
