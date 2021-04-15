/**
 * InfluxDuration represents components of InfluxDB duration.
 * See https://docs.influxdata.com/influxdb/v1.8/query_language/spec/#durations
 */
export type InfluxDuration = [
  w: number,
  d: number,
  h: number,
  m: number,
  s: number,
  ms: number,
  us: number,
  ns: number
]

const durationPartIndex: Record<string, number> = {
  w: 0,
  d: 1,
  h: 2,
  m: 3,
  s: 4,
  ms: 5,
  u: 6,
  µs: 6,
  ns: 7,
}

/**
 * ParseDuration parses string into a InfluxDuration, unknown duration parts are simply ignored.
 * @param duration duration literal per https://docs.influxdata.com/influxdb/v1.8/query_language/spec/#durations
 * @returns InfluxDuration
 */
export function parseDuration(duration: string): InfluxDuration {
  const retVal = new Array<number>(8).fill(0) as InfluxDuration
  const regExp = /([0-9]+)([^0-9]+)/g
  let matched: string[]
  while ((matched = regExp.exec(duration)) !== null) {
    const index = durationPartIndex[matched[2]]
    if (index === undefined) {
      // ignore unknown part
      continue
    }
    retVal[index] = parseInt(matched[1], 10)
  }
  return retVal
}

/**
 * CompareDurations implements sort comparator for InfluxDuration instances.
 */
export function compareDurations(a: InfluxDuration, b: InfluxDuration): number {
  let i = 0
  for (; i < 8; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i]
    }
  }
  return 0
}
