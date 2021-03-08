import {isObject} from 'lodash'

const dashrefresh = (refreshes) => {
  if (!Array.isArray(refreshes)) {
    return []
  }

  const normalized = refreshes.filter((r) => {
    if (!isObject(r)) {
      return false
    }

    const {dashboardID, refreshRate} = r
    const isTypeOfRefreshRate = !refreshRate || typeof refreshRate === 'number'

    if (typeof dashboardID !== 'number' || !isTypeOfRefreshRate) {
      return false
    }
    return true
  })

  return normalized
}

export default dashrefresh
