import {Timeseries, Scale} from 'src/perf/types'

type Values = Float32Array | Float64Array

export const simplify = (
  times: Float64Array,
  values: Float32Array,
  epsilon: number,
  xScale: Scale,
  yScale: Scale
): Timeseries => {
  // First do one pass with a fast, low quality simplification algorithm
  const xs = mapFloat32(times, xScale)
  const ys = mapFloat32(values, yScale)
  const indicesToKeep = simplifyDist(xs, ys, epsilon)
  const [newTimes, newValues] = collect(times, values, indicesToKeep)

  // Then do another pass with a slower, high quality simplification algorithm
  const nextXs = mapFloat32(newTimes, xScale)
  const nextYs = mapFloat32(newValues, yScale)
  const nextIndicesToKeep = simplifyDouglasPeucker(nextXs, nextYs, epsilon)

  return collect(newTimes, newValues, nextIndicesToKeep)
}

const simplifyDouglasPeucker = (xs: Values, ys: Values, epsilon: number) => {
  const keep = new Uint8Array(xs.length)
  const sqEpsilon = epsilon * epsilon

  keep[0] = 1
  keep[keep.length - 1] = 1

  simplifyDouglasPeuckerHelper(xs, ys, sqEpsilon, 0, keep.length - 1, keep)

  return keep
}

const simplifyDouglasPeuckerHelper = (
  xs: Values,
  ys: Values,
  epsilonSq: number,
  i0: number,
  i1: number,
  keep: Uint8Array
) => {
  const x0 = xs[i0]
  const y0 = ys[i0]
  const x1 = xs[i1]
  const y1 = ys[i1]

  let maxIndex = 0
  let maxDist = -1

  for (let i = i0 + 1; i < i1; i++) {
    const sqDist = sqSegmentDist(x0, y0, x1, y1, xs[i], ys[i])

    if (sqDist > maxDist) {
      maxIndex = i
      maxDist = sqDist
    }
  }

  if (maxDist > epsilonSq) {
    keep[maxIndex] = 1

    if (maxIndex - i0 > 1) {
      simplifyDouglasPeuckerHelper(xs, ys, epsilonSq, i0, maxIndex, keep)
    }

    if (i1 - maxIndex > 1) {
      simplifyDouglasPeuckerHelper(xs, ys, epsilonSq, maxIndex, i1, keep)
    }
  }
}

// Shortest distance from (x2, y2) to the line segment between (x0, y0) and (x1, y1)
const sqSegmentDist = (x0, y0, x1, y1, x2, y2) => {
  let x = x0
  let y = y0
  let dx = x1 - x0
  let dy = y1 - y0

  if (dx !== 0 || dy !== 0) {
    const t = ((x2 - x) * dx + (y2 - y) * dy) / (dx * dx + dy * dy)

    if (t > 1) {
      x = x1
      y = y1
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  dx = x2 - x
  dy = y2 - y

  return dx * dx + dy * dy
}

const simplifyDist = (xs: Values, ys: Values, epsilon: number) => {
  const epsilonSq = epsilon ** 2
  const keep = new Uint8Array(xs.length)

  let prevX = xs[0]
  let prevY = ys[0]

  keep[0] = 1
  keep[keep.length - 1] = 1

  for (let i = 1; i < xs.length; i++) {
    const x = xs[i]
    const y = ys[i]
    const sqDist = (prevY - y) ** 2 + (prevX - x) ** 2

    if (sqDist > epsilonSq) {
      keep[i] = 1
      prevX = x
      prevY = y
    }
  }

  return keep
}

const collect = (
  originalTimes: Float64Array,
  originalValues: Float32Array,
  indicesToKeep: Uint8Array
): Timeseries => {
  let resultLength = 0

  for (let j = 0; j < indicesToKeep.length; j++) {
    if (indicesToKeep[j] === 1) {
      resultLength++
    }
  }

  const times = new Float64Array(resultLength)
  const values = new Float32Array(resultLength)

  let i = 0

  for (let j = 0; j < indicesToKeep.length; j++) {
    if (indicesToKeep[j] === 1) {
      times[i] = originalTimes[j]
      values[i] = originalValues[j]
      i++
    }
  }

  return [times, values]
}

const mapFloat32 = (xs, f) => {
  const result = new Float32Array(xs.length)

  for (let i = 0; i < xs.length; i++) {
    result[i] = f(xs[i])
  }

  return result
}
