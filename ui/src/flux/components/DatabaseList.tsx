import React, {PureComponent} from 'react'

import DatabaseListItem from 'src/flux/components/DatabaseListItem'

import {showDatabases} from 'src/shared/apis/metaQuery'
import showDatabasesParser from 'src/shared/parsing/showDatabases'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {Source, NotificationAction} from 'src/types'
import {executeQuery} from 'src/shared/apis/flux/query'
import {parseResponse} from 'src/shared/parsing/flux/response'

interface Props {
  source: Source
  notify: NotificationAction
  v2?: boolean
}

export async function getBuckets(source: Source): Promise<string[]> {
  const {csv} = await executeQuery(source, 'buckets()')
  const tables = parseResponse(csv)
  if (tables && tables.length > 0) {
    const data = tables[0].data
    if (data.length > 1) {
      const nameIndex = data[0].indexOf('name')
      if (nameIndex > 0) {
        const buckets = data.slice(1).map(arr => arr[nameIndex] as string)
        return buckets.sort()
      }
    }
  }
  return []
}

interface State {
  databases: string[]
}

@ErrorHandling
class DatabaseList extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      databases: [],
    }
  }

  public componentDidMount() {
    this.getDatabases()
  }

  public async getDatabases() {
    const {source, v2} = this.props
    try {
      if (v2) {
        const buckets = await getBuckets(source)
        this.setState({databases: buckets})
      } else {
        const {data} = await showDatabases(source.links.proxy)
        const {databases} = showDatabasesParser(data)
        this.setState({databases: databases.sort()})
      }
    } catch (err) {
      console.error(err)
    }
  }

  public render() {
    const {databases} = this.state
    const {source, notify} = this.props

    return databases.map(db => {
      return (
        <DatabaseListItem db={db} key={db} source={source} notify={notify} />
      )
    })
  }
}

export default DatabaseList
