import {proxy} from 'utils/queryUrlGenerator'
import axios from 'axios'

export async function getMeasurements(proxyLink, db) {
  return proxy({
    source: proxyLink,
    query: "SHOW MEASUREMENTS",
    db,
  }).then(({data}) => {
    if (_isEmpty(data) || _hasError(data)) {
      return []
    }

    const series = data.results[0].series[0]
    return series.values.map((measurement) => {
      return measurement[0]
    })
  })
}

function _isEmpty(resp) {
  return !resp.results[0].series
}

function _hasError(resp) {
  return !!resp.results[0].error
}

export async function getGallery(galleryLink, measurements) {
  const serializer = (params) => {
    return params.map((m) => `measurement=${m}`).join('&')
  }
  const response = await axios({
    url: galleryLink,
    method: 'GET',
    data: {},
    params: measurements,
    paramsSerializer: serializer,
    headers: {},
  })

  return response
}
