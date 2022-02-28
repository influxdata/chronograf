export default function errorMessage(e: any): unknown {
  if (!e) {
    return e
  }
  if (e.message) {
    return e.message
  }
  if (e.statusText) {
    return e.statusText
  }
  return e
}
