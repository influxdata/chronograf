import React, {Component} from 'react'
import Dropdown from 'src/shared/components/Dropdown'

import {showDatabases} from 'src/shared/apis/metaQuery'
import parsers from 'src/shared/parsing'
import {Source} from 'src/types/sources'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {getBuckets} from 'src/flux/components/DatabaseList'
const {databases: showDatabasesParser} = parsers

interface Database {
  text: string
}

interface Props {
  database: string
  onSelectDatabase: (database: Database) => void
  onStartEdit?: () => void
  onErrorThrown: (error: string) => void
  source: Source
  // true loads buckets in place of databases
  useBuckets?: boolean
}

interface State {
  databases: string[]
}

@ErrorHandling
class DatabaseDropdown extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      databases: [],
    }
  }

  public componentDidMount() {
    this.getDatabasesAsync()
  }

  public render() {
    const {databases} = this.state
    const {database, onSelectDatabase, onStartEdit} = this.props

    if (!database) {
      this.componentDidMount()
    }

    return (
      <Dropdown
        items={databases.map(text => ({
          text,
        }))}
        selected={database || 'Loading...'}
        onChoose={onSelectDatabase}
        onClick={onStartEdit ? onStartEdit : null}
      />
    )
  }

  private getDatabasesAsync = async (): Promise<void> => {
    const {
      source,
      database,
      onSelectDatabase,
      onErrorThrown,
      useBuckets,
    } = this.props
    let databases: string[]
    if (useBuckets) {
      try {
        databases = await getBuckets(source)
        databases.sort((a, b) => {
          // databases starting with '_' are the last
          if (b.startsWith('_')) {
            if (a.startsWith('_')) {
              return a.localeCompare(b)
            }
            return -1
          }
          return a.localeCompare(b)
        })
      } catch (e) {
        console.error(e)
        onErrorThrown(e)
        return
      }
    } else {
      try {
        const proxy = source.links.proxy
        const {data} = await showDatabases(proxy)
        const parserResult = showDatabasesParser(data)
        if (parserResult.errors.length > 0) {
          throw parserResult.errors[0] // only one error can come back from this, but it's returned as an array
        }
        databases = parserResult.databases
      } catch (error) {
        console.error(error)
        onErrorThrown(error)
        return
      }
    }
    const nonSystemDatabases = databases.filter(
      name => !name.startsWith('_internal')
    )

    this.setState({
      databases: nonSystemDatabases,
    })
    const selectedDatabaseText = nonSystemDatabases.includes(database)
      ? database
      : nonSystemDatabases[0] || 'No databases'
    onSelectDatabase({
      text: selectedDatabaseText,
    })
  }
}

export default DatabaseDropdown
