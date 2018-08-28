import React, {PureComponent} from 'react'

import DatabaseListItem from 'src/flux/components/DatabaseListItem'

import {showDatabases} from 'src/shared/apis/metaQuery'
import showDatabasesParser from 'src/shared/parsing/showDatabases'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {Service, NotificationAction} from 'src/types'

interface Props {
  service: Service
  notify: NotificationAction
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
    const {service} = this.props

    try {
      const {data} = await showDatabases(`${service.links.source}/proxy`)
      const {databases} = showDatabasesParser(data)
      const sorted = databases.sort()

      this.setState({databases: sorted})
    } catch (err) {
      console.error(err)
    }
  }

  public render() {
    const {databases} = this.state
    const {service, notify} = this.props

    return databases.map(db => {
      return (
        <DatabaseListItem key={db} db={db} service={service} notify={notify} />
      )
    })
  }
}

export default DatabaseList
