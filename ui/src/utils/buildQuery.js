import buildInfluxQLQuery from 'utils/influxql'

const buildQuery = (proxy, queryConfig, timeRange) => {
  const text =
    queryConfig.rawText ||
    buildInfluxQLQuery(queryConfig.range || timeRange, queryConfig)
  return {host: [proxy], text, id: queryConfig.id, queryConfig}
}

export default buildQuery
