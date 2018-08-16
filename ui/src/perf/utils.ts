import uuid from 'uuid'
import {range, extent as extentOne} from 'd3-array'
import {line, curveLinear, curveStep, curveMonotoneX} from 'd3-shape'
import {scaleLinear, scaleUtc} from 'd3-scale'
import {DateTime} from 'luxon'

import {Scale, Timeseries, VisDimensions} from 'src/perf/types'

export const clearCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) => {
  const context = canvas.getContext('2d')
  const dpRatio = window.devicePixelRatio || 1

  // Configure canvas to draw on retina displays correctly
  canvas.width = width * dpRatio
  canvas.height = height * dpRatio
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context.scale(dpRatio, dpRatio)

  context.clearRect(0, 0, width, height)
}

export const decodeRunLengthEncodedTimes = (
  startTime: number,
  timeDelta: number,
  timeCount: number
): Float64Array => {
  const result = new Float64Array(timeCount)
  const msStartTime = startTime / 1e6
  const msTimeDelta = timeDelta / 1e6

  for (let i = 0; i < timeCount; i++) {
    result[i] = msStartTime + msTimeDelta * i
  }

  return result
}

export const nanosecondsToMilliseconds = (times: Float64Array): void => {
  for (let i = 0; i < times.length; i++) {
    times[i] = times[i] / 1e6
  }
}

export const buildLayout = (
  numColumns: number,
  numGraphs: number,
  interval: string
) => {
  const layout: any = []

  for (let i = 0; i < numGraphs; i++) {
    const query = `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-02' AND time < '2010-01-07' AND "host"='server-${i}' GROUP BY time(${interval}), host`

    layout.push({
      query,
      i: uuid.v4(),
      x: Math.floor((i % numColumns) / numColumns * 12),
      y: Math.ceil(i / numColumns),
      w: Math.floor(12 / numColumns),
      h: 4,
    })
  }

  return layout
}

const curveFactories = {
  Linear: curveLinear,
  Step: curveStep,
  Smooth: curveMonotoneX,
}

export const drawLine = (
  context: CanvasRenderingContext2D,
  xs: Float32Array | Float64Array,
  ys: Float32Array | Float64Array,
  dimensions: VisDimensions,
  curvePreference: string
) => {
  const {xScale, yScale, width} = dimensions
  const xDensity = width / xs.length // px per point
  const curve = xDensity < 1 ? curveLinear : curveFactories[curvePreference]
  const is = range(0, xs.length)
  const plotter = line()
    .x(i => xScale(xs[i]))
    .y(i => yScale(ys[i]))
    .curve(curve)
    .context(context)

  context.beginPath()
  plotter(is)
  context.stroke()
}

export const drawAxes = (
  context: CanvasRenderingContext2D,
  visDimensions: VisDimensions,
  xTicks: number[],
  yTicks: number[]
) => {
  const {
    xScale,
    yScale,
    width,
    height,
    margins,
    xTickFormatter,
    yTickFormatter,
  } = visDimensions
  const xAxisY = height - margins.bottom

  context.beginPath()
  context.moveTo(margins.left, xAxisY)
  context.lineTo(width - margins.right, xAxisY)
  context.stroke()

  context.beginPath()
  context.moveTo(margins.left, xAxisY)
  context.lineTo(margins.left, margins.top)
  context.stroke()

  for (const xTick of xTicks) {
    const x = xScale(xTick) + margins.left

    context.beginPath()
    context.moveTo(x, xAxisY)
    context.lineTo(x, margins.top)
    context.stroke()

    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.font = 'bold 10px Roboto'
    context.fillText(xTickFormatter(xTick), x, xAxisY + 5)
  }

  for (const yTick of yTicks) {
    const y = yScale(yTick) + margins.top

    context.beginPath()
    context.moveTo(margins.left, y)
    context.lineTo(width - margins.right, y)
    context.stroke()

    context.textAlign = 'end'
    context.textBaseline = 'middle'
    context.font = 'bold 10px Roboto'
    context.fillText(yTickFormatter(yTick), margins.left - 8, y)
  }
}

const dateTimeFormatForDuration = (ms: number): string => {
  if (ms < 1000) {
    return 'HH::mm:ss.SSS'
  } else if (ms < 1000 * 60 * 60 * 24) {
    return 'HH::mm:ss'
  } else if (ms < 1000 * 60 * 60 * 24 * 30) {
    return 'D HH:mm ZZZZ'
  } else {
    return 'D HH:mm ZZZZ'
  }
}

export const formatTimeTick = (
  t: number,
  tz: String,
  [d0, d1]: [number, number]
): string =>
  DateTime.fromMillis(t, {zone: tz}).toFormat(
    dateTimeFormatForDuration(d1 - d0)
  )

const extent = (xss: Array<Float32Array | Float64Array>): [number, number] => {
  const extents = []

  for (const xs of xss) {
    extents.push(...extentOne(xs))
  }

  return extentOne(extents)
}

export const calculateDomains = (
  ts: Timeseries[]
): [[number, number], [number, number]] => {
  const timess = ts.map(([times]) => times)
  const valuess = ts.map(([_, values]) => values)
  const xDomain = extent(timess)
  const yDomain = extent(valuess)

  return [xDomain, yDomain]
}

export const createScale = (
  domain: [number, number],
  range: [number, number],
  paddingRatio: number = 0
): Scale => {
  const [d0, d1] = domain
  const padding = (d1 - d0) * paddingRatio

  return scaleLinear()
    .domain([d0 - padding, d1 + padding])
    .range(range)
}

export const timeTicks = (
  t0: number,
  t1: number,
  x0: number,
  x1: number
): number[] => {
  const numTicks = x1 - x0 < 550 ? 2 : 4

  return scaleUtc()
    .domain([t0, t1])
    .range([x0, x1])
    .ticks(numTicks)
    .map(d => d.valueOf())
}
