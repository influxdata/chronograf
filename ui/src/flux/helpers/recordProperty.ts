import fluxString from './fluxString'

export default function recordProperty(key: string) {
  if (key && /[^A-Za-z0-9_]/.test(key)) {
    return `r.[${fluxString(key)}]`
  }
  return `r.${key}`
}
