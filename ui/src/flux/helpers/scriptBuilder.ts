interface Status {
  type: string
  text: string
}

export const parseError = (error): Status => {
  if (error.data) {
    if (typeof error.data === 'string') {
      const s = error.data.slice(0, -5) // There is a 'null\n' at the end of these responses
      const data = JSON.parse(s)
      return {type: 'error', text: data.message}
    } else if (typeof error.data === 'object') {
      if (error.data.error) {
        return {type: 'error', text: error.data.error}
      }
    }
  }
  if (error.message) {
    return {type: 'error', text: error.message}
  }
  if (error.statusText) {
    return {type: 'error', text: error.statusText}
  }
  return {type: 'error', text: error.toString()}
}
