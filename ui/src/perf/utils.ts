import uuid from 'uuid'

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

// xScale(t: Timeseries, m: Margins, width, height)
// yScale(t: Timeseries, m: Margins, width, height)

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
