import {TEMPLATE_VARIABLE_QUERIES} from 'dashboards/constants'

const generateTemplateVariableQuery = ({
  type,
  query: {
    database,
    // rp, TODO
    measurement,
    tagKey,
  },
}) => {
  const tempVars = []

  if (database) {
    tempVars.push({
      tempVar: ':database:',
      values: [
        {
          type: 'database',
          value: database,
        },
      ],
    })
  }
  if (measurement) {
    tempVars.push({
      tempVar: ':measurement:',
      values: [
        {
          type: 'measurement',
          value: measurement,
        },
      ],
    })
  }
  if (tagKey) {
    tempVars.push({
      tempVar: ':tagKey:',
      values: [
        {
          type: 'tagKey',
          value: tagKey,
        },
      ],
    })
  }

  const query = TEMPLATE_VARIABLE_QUERIES[type]

  return {
    query,
    tempVars,
  }
}

export const makeQueryForTemplate = ({influxql, db, measurement, tagKey}) =>
  influxql
    .replace(':database:', db)
    .replace(':measurement:', measurement)
    .replace(':tagKey:', tagKey)

export default generateTemplateVariableQuery
