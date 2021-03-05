export default function recordProperty(key: string) {
  if (key && /[^A-Za-z0-9_]/.test(key)) {
    return `r.["${key}"]`
  }
  return `r.${key}`
}
