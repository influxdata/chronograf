import React, {PureComponent} from 'react'

import {showDatabases} from 'src/shared/apis/metaQuery'
import showDatabasesParser from 'src/shared/parsing/showDatabases'

import Dropdown from 'src/shared/components/Dropdown'
import {OnChangeArg} from 'src/types/flux'
import {Service} from 'src/types'

interface Props {
  funcID: string
  argKey: string
  value: string
  bodyID: string
  declarationID: string
  onChangeArg: OnChangeArg
  service: Service
}

interface State {
  dbs: string[]
}

interface DropdownItem {
  text: string
}

class FromDatabaseDropdown extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      dbs: [],
    }
  }

  public async componentDidMount() {
    const {service} = this.props

    try {
      const {data} = await showDatabases(`${service.links.source}/proxy`)
      const {databases} = showDatabasesParser(data)
      const sorted = databases.sort()

      this.setState({dbs: sorted})
    } catch (err) {
      console.error(err)
    }
  }

  public render() {
    const {value, argKey} = this.props

    return (
      <div className="func-arg">
        <label className="func-arg--label">{argKey}</label>
        <Dropdown
          selected={value}
          className="from--dropdown dropdown-160 func-arg--value"
          menuClass="dropdown-astronaut"
          buttonColor="btn-default"
          items={this.items}
          onChoose={this.handleChooseDatabase}
        />
      </div>
    )
  }

  private handleChooseDatabase = (item: DropdownItem): void => {
    const {argKey, funcID, onChangeArg, bodyID, declarationID} = this.props
    onChangeArg({
      funcID,
      key: argKey,
      value: item.text,
      bodyID,
      declarationID,
      generate: true,
    })
  }

  private get items(): DropdownItem[] {
    return this.state.dbs.map(text => ({text}))
  }
}

export default FromDatabaseDropdown
