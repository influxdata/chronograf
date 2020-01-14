import {isObject} from 'lodash'

const dashrefresh = (refreshes) => {
  if (!Array.isArray(refreshes)) {
    return []
  }

  const normalized = refreshes.filter(r => {
    if (!isObject(r)) {
      return false
    }

    const {dashboardID, refreshRate} = r

    if (typeof dashboardID !== 'number' || !(!refreshRate || typeof refreshRate === 'number')) {
      return false
    }
    return true
  })

  return normalized
}

export default dashrefresh
