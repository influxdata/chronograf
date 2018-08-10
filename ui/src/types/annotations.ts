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

export enum AnnotationsDisplaySetting {
  HideAnnotations = 'Hide Annotations',
  FilterAnnotationsByTag = 'Filter Annotations By Tags',
  // ShowCellLevelAnnotations = 'Show Cell Level Annotations',
}

export interface AnnotationTags {
  [tagKey: string]: string
}
