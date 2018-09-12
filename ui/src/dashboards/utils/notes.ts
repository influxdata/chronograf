export const humanizeNote = (text: string): string => {
  if (text) {
    return text.replace(/&gt;/g, '>').replace(/&#39;/g, "'")
  }
  return ''
}
