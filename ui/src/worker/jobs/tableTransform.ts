import {fetchData} from 'src/worker/utils'
import {transformTableData} from 'src/dashboards/utils/tableGraph'

const tableTransform = async (msg) => {
  const dbResult = await fetchData(msg)

  const {
    data,
    sort,
    fieldOptions,
    tableOptions,
    timeFormat,
    decimalPlaces,
  } = dbResult

  return transformTableData(
    data,
    sort,
    fieldOptions,
    tableOptions,
    timeFormat,
    decimalPlaces
  )
}

export default tableTransform
