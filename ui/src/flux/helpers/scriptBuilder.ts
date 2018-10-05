interface Status {
  type: string
  text: string
}

export const parseError = (error): Status => {
  if (error.data) {
    const s = error.data.slice(0, -5) // There is a 'null\n' at the end of these responses
    const data = JSON.parse(s)
    return {type: 'error', text: data.message}
  }

  return {type: 'error', text: error.message}
}
