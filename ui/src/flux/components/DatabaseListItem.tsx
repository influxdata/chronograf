import React, {PureComponent} from 'react'
import classnames from 'classnames'

// Components
import SchemaExplorerTree from 'src/flux/components/SchemaExplorerTree'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// Types
import {Source, NotificationAction} from 'src/types'
import SchemaItemCategories from 'src/flux/components/SchemaItemCategories'

interface Props {
  db: string
  source: Source
  notify: NotificationAction
}

interface State {
  opened: OpenState
  searchTerm: string
}

class DatabaseListItem extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      opened: OpenState.UNOPENED,
      searchTerm: '',
    }
  }

  public render() {
    const {db} = this.props

    return (
      <div className={this.className} onClick={this.handleClick}>
        <div className="flux-schema--item">
          <div className="flex-schema-item-group flux-schema-item--expandable">
            <div className="flux-schema--expander" />
            {db}
            <span className="flux-schema--type">Bucket</span>
          </div>
        </div>
        {this.categories}
      </div>
    )
  }

  private get categories(): JSX.Element {
    const {db, source, notify} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    if (!isUnopen) {
      return (
        <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
          <SchemaExplorerTree bucket={db} source={source} key={db}>
            {tree => (
              <SchemaItemCategories
                db={db}
                source={source}
                notify={notify}
                categoryTree={tree}
              />
            )}
          </SchemaExplorerTree>
        </div>
      )
    }
  }

  private get className(): string {
    return classnames('flux-schema-tree', {
      expanded: this.state.opened === OpenState.OPENED,
    })
  }

  private handleClick = (e): void => {
    e.stopPropagation()

    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default DatabaseListItem
