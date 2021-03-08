import uuid from 'uuid'

import {Annotation, TagFilter, TagFilterType} from 'src/types/annotations'

export const ANNOTATION_MIN_DELTA = 0.5

export const ADDING = 'adding'
export const EDITING = 'editing'

export const DEFAULT_ANNOTATION = (): Annotation => ({
  id: 'tempAnnotation',
  text: 'Name Me',
  startTime: null,
  endTime: null,
  links: {self: ''},
})

export const NEW_TAG_FILTER = (): TagFilter => ({
  id: uuid.v4(),
  tagKey: '',
  tagValue: '',
  filterType: TagFilterType.Equals,
})

export const visibleAnnotations = (
  xAxisRange: [number, number],
  annotations: Annotation[] = []
): Annotation[] => {
  const [xStart, xEnd] = xAxisRange

  if (xStart === 0 && xEnd === 0) {
    return []
  }

  return annotations.filter(a => {
    if (a.startTime === null || a.endTime === null) {
      return false
    }
    if (a.endTime === a.startTime) {
      return xStart <= a.startTime && a.startTime <= xEnd
    }

    return !(a.endTime < xStart || xEnd < a.startTime)
  })
}

export const FILTER_TYPES = [
  TagFilterType.Equals,
  TagFilterType.NotEquals,
  TagFilterType.RegEquals,
  TagFilterType.RegNotEquals,
]

// An annotation is stored as a point in an InfluxDB time series on the
// backend. The data of the annotation are stored as tags on the point, so a
// user must not use the same tag keys to avoid naming collisions.
export const BLACKLISTED_KEYS = [
  'id',
  'startTime',
  'start_time',
  'endTime',
  'end_time',
  'modified_time_ns',
  'deleted',
]

export const tagFilterToInfluxQLExp = (t: TagFilter): string => {
  switch (t.filterType) {
    case TagFilterType.Equals:
      return `"${t.tagKey}" = '${t.tagValue}'`
    case TagFilterType.NotEquals:
      return `"${t.tagKey}" != '${t.tagValue}'`
    case TagFilterType.RegEquals:
      return `"${t.tagKey}" =~ /${t.tagValue}/`
    case TagFilterType.RegNotEquals:
      return `"${t.tagKey}" !~ /${t.tagValue}/`
  }
}
