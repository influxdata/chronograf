import {getRootNode} from 'src/utils/nodes'

export const getBasepath = () => {
  const rootNode = getRootNode()
  if (!rootNode) {
    return ''
  }

  let basepath = rootNode.getAttribute('data-basepath') || ''
  if (basepath !== '') {
    basepath = basepath.slice(0, basepath.length - 1)
  }

  return basepath
}

export const stripPrefix = (pathname, basepath = getBasepath()) => {
  if (basepath === '') {
    return pathname
  }

  const expr = new RegExp(`^${basepath}`)
  const matches = pathname.match(expr)
  if (matches) {
    return pathname.replace(expr, '')
  }
}
