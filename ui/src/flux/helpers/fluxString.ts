const FLUX_ESCAPE = {
  '\r': '\\r',
  '\n': '\\n',
  '\t': '\\t',
  '"': '\\"',
  '\\': '\\\\',
  '${': '\\${',
}
/**
 * Create a flux string out of a javascript string
 * @see https://docs.influxdata.com/influxdb/v2.0/reference/flux/language/lexical-elements/#string-literals
 * @param s flux string
 */
export default function fluxString(s: string): string {
  return `"${s.replace(/\r|\n|\t|"|\\|\$\{/g, (x: string) => FLUX_ESCAPE[x])}"`
}
