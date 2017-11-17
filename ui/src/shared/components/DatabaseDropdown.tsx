import * as React from 'react'
import Dropdown from 'shared/components/Dropdown'

import {showDatabases} from 'shared/apis/metaQuery'
import parsers from 'shared/parsing'
const {databases: showDatabasesParser} = parsers

import {Source} from 'src/types'

export interface DatabaseDropdownProps {
  source: Source
  database: string
  onSelectDatabase: ({text}: {text: string}) => void
  onStartEdit?: () => void
  onErrorThrown: (error: string) => void
}

export interface DatabaseDropdownState {
  databases: string[]
}

class DatabaseDropdown extends React.Component<
  DatabaseDropdownProps,
  DatabaseDropdownState
> {
  constructor(props: DatabaseDropdownProps) {
    super(props)
    this.state = {
      databases: [],
    }
  }

  private _getDatabases = async () => {
    const {database, onSelectDatabase, onErrorThrown, source} = this.props
    const proxy = source.links.proxy
    try {
      const {data} = await showDatabases(proxy)
      const {databases, errors} = showDatabasesParser(data)
      if (errors.length > 0) {
        throw errors[0] // only one error can come back from this, but it's returned as an array
      }

      const nonSystemDatabases = databases.filter(name => name !== '_internal')

      this.setState({databases: nonSystemDatabases})
      const selectedDatabaseText = nonSystemDatabases.includes(database)
        ? database
        : nonSystemDatabases[0] || 'No databases'
      onSelectDatabase({text: selectedDatabaseText})
    } catch (error) {
      console.error(error)
      onErrorThrown(error)
    }
  }

  public componentDidMount() {
    this._getDatabases()
  }

  public render() {
    const {databases} = this.state
    const {database, onSelectDatabase, onStartEdit} = this.props

    if (!database) {
      this.componentDidMount()
    }

    return (
      <Dropdown
        items={databases.map(text => ({text}))}
        selected={database || 'Loading...'}
        onChoose={onSelectDatabase}
        onClick={onStartEdit ? onStartEdit : null}
      />
    )
  }
}

export default DatabaseDropdown
