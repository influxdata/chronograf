import AJAX from 'src/utils/ajax'
import {Annotation, TagFilter} from 'src/types/annotations'
import {tagFilterToInfluxQLExp} from 'src/shared/annotations/helpers'

const msToRFCString = (ms: number) =>
  ms && new Date(Math.round(ms)).toISOString()

const rfcStringToMS = (rfc3339: string) => rfc3339 && Date.parse(rfc3339)

interface ServerAnnotation {
  id: string
  startTime: string
  endTime: string
  text: string
  tags?: {[tagKey: string]: string}
  links: {self: string}
}

const annoToMillisecond = (annotation: ServerAnnotation): Annotation => ({
  ...annotation,
  startTime: rfcStringToMS(annotation.startTime),
  endTime: rfcStringToMS(annotation.endTime),
})

const annoToRFC = (annotation: Annotation): ServerAnnotation => ({
  ...annotation,
  startTime: msToRFCString(annotation.startTime),
  endTime: msToRFCString(annotation.endTime),
})

export const createAnnotation = async (url: string, annotation: Annotation) => {
  const data = annoToRFC(annotation)
  const response = await AJAX({method: 'POST', url, data})
  return annoToMillisecond(response.data)
}

export const getAnnotations = async (
  url: string,
  since: number,
  until: number | null,
  tagFilters: TagFilter[]
) => {
  let paramedUrl = `${url}?since=${encodeURIComponent(msToRFCString(since))}`

  if (!!until) {
    paramedUrl += `&until=${encodeURIComponent(msToRFCString(until))}`
  }

  if (tagFilters.length) {
    for (const t of tagFilters) {
      paramedUrl += `&tag=${encodeURIComponent(tagFilterToInfluxQLExp(t))}`
    }
  }

  const {data} = await AJAX({method: 'GET', url: paramedUrl})

  return data.annotations.map(annoToMillisecond)
}

export const deleteAnnotation = async (annotation: Annotation) => {
  const url = annotation.links.self
  await AJAX({method: 'DELETE', url})
}

export const updateAnnotation = async (annotation: Annotation) => {
  const url = annotation.links.self
  const data = annoToRFC(annotation)
  await AJAX({method: 'PATCH', url, data})
}
