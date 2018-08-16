import uuid from 'uuid'
import {range, extent} from 'd3-array'
import {line} from 'd3-shape'

import {Scale} from 'src/perf/types'

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

  for (let i = 0; i < timeCount; i++) {
    result[i] = startTime + timeDelta * i
  }

  return result
}

export const buildLayout = (
  numColumns: number,
  numGraphs: number,
  interval: string
) => {
  const layout: any = []

  for (let i = 0; i < numGraphs; i++) {
    const query = `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-${i}' GROUP BY time(${interval}), host`

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

export const drawLine = (
  context: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  xs: Float32Array | Float64Array,
  ys: Float32Array | Float64Array
) => {
  const is = range(0, xs.length)
  const plotter = line()
    .x(i => xScale(xs[i]))
    .y(i => yScale(ys[i]))
    .context(context)

  context.beginPath()
  plotter(is)
}

export const createScale = (
  xss: Array<Float32Array | Float64Array>,
  size: number,
  startMargin: number = 0,
  endMargin: number = 0,
  reverse: boolean = false
): Scale => {
  const extents = []

  for (const xs of xss) {
    extents.push(...extent(xs))
  }

  const [d0, d1] = extent(extents)
  const range = [startMargin, size - endMargin]

  if (reverse) {
    range.reverse()
  }

  const [r0, r1] = range
  const m = (r1 - r0) / (d1 - d0)
  const b = r0 - m * d0

  return x => m * x + b
}
