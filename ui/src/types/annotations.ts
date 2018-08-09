export interface Annotation {
  id: string
  startTime: number
  endTime: number
  text: string
  tags?: AnnotationTags
  links: {self: string}
}

export interface AnnotationRange {
  since: number
  until: number
}

export enum TagFilterType {
  Equals = '==',
  NotEquals = '!=',
  RegEquals = '=~',
  RegNotEquals = '!~',
}

export interface TagFilter {
  id: string
  tagKey: string
  tagValue: string
  filterType: TagFilterType
}

export interface AnnotationTags {
  [tagKey: string]: string
}
