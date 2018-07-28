export const createMarkerElement = (
  title: string,
  tempVar: string
): HTMLElement => {
  const marker = document.createElement('span')
  const replacementText = document.createTextNode(`${tempVar}`)

  marker.setAttribute('title', title)
  marker.appendChild(replacementText)
  marker.classList.add('cm-temp-var')

  return marker
}
