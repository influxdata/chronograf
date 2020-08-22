import _ from 'lodash'

import {showDatabases, showRetentionPolicies} from 'src/shared/apis/metaQuery'
import showDatabasesParser from 'src/shared/parsing/showDatabases'
import showRetentionPoliciesParser from 'src/shared/parsing/showRetentionPolicies'

import {Namespace} from 'src/types/queries'

const getRetentionPolices = async (proxy, databases) => {
  let results = []

  for (let i = 0; i < databases.length; i++) {
    try {
      const database = databases[i]

      const {
        data: {results: rps},
      } = await showRetentionPolicies(proxy, database)

      for (let j = 0; j < rps.length; j++) {
        const rp = rps[j]
        const {retentionPolicies} = showRetentionPoliciesParser(rp)

        const dbrp = retentionPolicies.map(r => ({
          database,
          retentionPolicy: r.name,
        }))

        results = [...results, ...dbrp]
      }
    } catch (e) {
      console.error(e)
    }
  }

  return results
}

export const getDatabasesWithRetentionPolicies = async (
  proxy: string
): Promise<Namespace[]> => {
  try {
    const {data} = await showDatabases(proxy)
    const {databases} = showDatabasesParser(data)
    const namespaces = await getRetentionPolices(proxy, databases)

    const sorted = _.sortBy(namespaces, ['database', 'retentionPolicy'])

    return sorted
  } catch (err) {
    console.error(err)
    return []
  }
}
