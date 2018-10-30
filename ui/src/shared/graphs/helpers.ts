// Libraries
import _ from 'lodash'
/* eslint-disable no-magic-numbers */
import {toRGB} from 'src/shared/graphs/toRGB'
import {CSSProperties} from 'react'

// Utils
import {getDeep} from 'src/utils/wrappers'

// Constants
import {DataType} from 'src/shared/constants'

// Types
import {FluxTable, TimeRange} from 'src/types'
import {TimeSeriesServerResponse} from 'src/types/series'

export const LINE_COLORS = [
  '#00C9FF',
  '#9394FF',
  '#4ED8A0',
  '#ff0054',
  '#ffcc00',
  '#33aa99',
  '#9dfc5d',
  '#92bcc3',
  '#ca96fb',
  '#ff00f0',
  '#38b94a',
  '#3844b9',
  '#a0725b',
]

export const SMALL_CELL_HEIGHT = 2

export const darkenColor = colorStr => {
  // Defined in dygraph-utils.js
  const color = toRGB(colorStr)
  color.r = Math.floor((255 + color.r) / 2)
  color.g = Math.floor((255 + color.g) / 2)
  color.b = Math.floor((255 + color.b) / 2)
  return `rgb(${color.r},${color.g},${color.b})`
}

// Bar Graph code below is adapted from http://dygraphs.com/tests/plotters.html
export const barPlotter = e => {
  // We need to handle all the series simultaneously.
  if (e.seriesIndex !== 0) {
    return
  }

  const g = e.dygraph
  const ctx = e.drawingContext
  const sets = e.allSeriesPoints
  const yBottom = e.dygraph.toDomYCoord(0)

  // Find the minimum separation between x-values.
  // This determines the bar width.
  let minSep = Infinity
  for (let j = 0; j < sets.length; j++) {
    const points = sets[j]
    for (let i = 1; i < points.length; i++) {
      const sep = points[i].canvasx - points[i - 1].canvasx
      if (sep < minSep) {
        minSep = sep
      }
    }
  }

  // calculate bar width using some graphics math while
  // ensuring a bar is never smaller than one px, so it is always rendered
  const barWidth = Math.max(Math.floor(2.0 / 3.0 * minSep), 1.0)

  const fillColors = []
  const strokeColors = g.getColors()

  let selPointX
  if (g.selPoints_ && g.selPoints_.length) {
    selPointX = g.selPoints_[0].canvasx
  }

  for (let i = 0; i < strokeColors.length; i++) {
    fillColors.push(darkenColor(strokeColors[i]))
  }

  ctx.lineWidth = 2

  for (let j = 0; j < sets.length; j++) {
    ctx.strokeStyle = strokeColors[j]
    for (let i = 0; i < sets[j].length; i++) {
      const p = sets[j][i]
      const centerX = p.canvasx
      ctx.fillStyle = fillColors[j]
      const xLeft =
        sets.length === 1
          ? centerX - barWidth
          : centerX - barWidth * (1 - j / sets.length)

      ctx.fillRect(
        xLeft,
        p.canvasy,
        barWidth / sets.length,
        yBottom - p.canvasy
      )

      // hover highlighting
      if (selPointX === centerX) {
        ctx.strokeRect(
          xLeft,
          p.canvasy,
          barWidth / sets.length,
          yBottom - p.canvasy
        )
      }
    }
  }
}

export const makeLegendStyles = (
  graphDiv,
  legendDiv,
  legendMouseX
): CSSProperties => {
  if (!graphDiv || !legendDiv || legendMouseX === null) {
    return {}
  }

  const graphRect = graphDiv.getBoundingClientRect()
  const legendRect = legendDiv.getBoundingClientRect()

  const normalizedLegendMouseX = legendMouseX > 0 ? legendMouseX : 0
  const mouseX = normalizedLegendMouseX + graphRect.left
  const halfLegendWidth = legendRect.width / 2
  const pageHeaderHeight = 60

  const minimumX = graphRect.left
  const maximumX = Math.max(
    graphRect.left + graphRect.width - halfLegendWidth,
    minimumX
  )

  const minimumY = graphRect.top - pageHeaderHeight

  let translateX = mouseX - halfLegendWidth
  let translateY = graphRect.height + graphRect.top

  // Enforce Left Edge of Graph
  if (mouseX - halfLegendWidth < minimumX) {
    translateX = minimumX
  }

  // Enforce Right Edge of Graph
  if (mouseX > maximumX) {
    translateX = Math.max(maximumX - halfLegendWidth, minimumX)
  }

  // Prevent Legend from rendering off screen
  const rightMargin = window.innerWidth - (mouseX + graphRect.left)
  const LEGEND_BUFFER = 12
  if (window.innerHeight - graphRect.bottom < legendRect.height) {
    translateX = mouseX + LEGEND_BUFFER
    translateY = Math.max(minimumY, pageHeaderHeight + LEGEND_BUFFER)

    if (rightMargin < legendRect.width + LEGEND_BUFFER) {
      translateX = mouseX - (legendRect.width + LEGEND_BUFFER)
    }
  }

  return {
    transform: `translate(${translateX}px, ${translateY}px)`,
  }
}

// matches everything up to the first '.'
export const removeMeasurement = (label = '') => {
  const [measurement] = label.match(/^([^.])+./g) || ['']
  return label.replace(measurement, '')
}

export const hasherino = (str, len) =>
  str
    .split('')
    .map(char => char.charCodeAt(0))
    .reduce((hash, code) => hash + code, 0) % len

export const LABEL_WIDTH = 44
export const CHAR_PIXELS = 7

export const getDataUUID = (
  data: TimeSeriesServerResponse[] | FluxTable[],
  dataType: DataType
): string => {
  if (dataType === DataType.influxQL) {
    return getInfluxQLDataUUID(data as TimeSeriesServerResponse[])
  } else {
    return getFluxDataUUID(data as FluxTable[])
  }
}

const getInfluxQLDataUUID = (data: TimeSeriesServerResponse[]): string => {
  return getDeep(data, '0.response.uuid', '')
}

const getFluxDataUUID = (data: FluxTable[]): string => {
  return getDeep(data, '0.id', '')
}

export const isFluxDataEqual = (
  prevData: FluxTable[],
  newData: FluxTable[]
): boolean => {
  return getFluxDataUUID(prevData) === getFluxDataUUID(newData)
}

export const isInluxQLDataEqual = (
  prevData: TimeSeriesServerResponse[],
  newData: TimeSeriesServerResponse[]
): boolean => {
  return getInfluxQLDataUUID(prevData) === getInfluxQLDataUUID(newData)
}

interface DataProps {
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataType
  timeRange?: TimeRange
}
export const hasDataPropsChanged = (
  prevProps: DataProps,
  newProps: DataProps
): boolean => {
  const isDataTypeChanged = prevProps.dataType !== newProps.dataType
  const isDataIDsChanged =
    getDataUUID(prevProps.data, prevProps.dataType) !==
    getDataUUID(newProps.data, newProps.dataType)
  const isTimeRangeChanged = !_.isEqual(
    _.get(prevProps, 'timeRange'),
    _.get(newProps, 'timeRange')
  )

  const isDataChanged =
    isDataTypeChanged || isDataIDsChanged || isTimeRangeChanged

  return isDataChanged
}
