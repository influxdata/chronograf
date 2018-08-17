import {getRootNode} from 'src/utils/nodes'

export const getBasepath = () => {
  const rootNode = getRootNode()
  if (!rootNode) {
    return ''
  }

  return rootNode.getAttribute('data-basepath') || ''
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
