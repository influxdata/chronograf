const defaultQueryConfig = ({id}) => {
  const queryConfig = {
    id,
    database: null,
    measurement: null,
    retentionPolicy: null,
    fields: [],
    tags: {},
    groupBy: {
      time: null,
      tags: [],
    },
    areTagsAccepted: true,
    rawText: null,
    status: null,
    shifts: [],
  }

  return queryConfig
}

export default defaultQueryConfig
