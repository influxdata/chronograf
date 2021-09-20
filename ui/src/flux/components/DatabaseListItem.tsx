import React, {PureComponent} from 'react'
import classnames from 'classnames'

// Components
import SchemaExplorerTree from 'src/flux/components/SchemaExplorerTree'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// Types
import {Source, NotificationAction, TimeRange} from 'src/types'
import SchemaItemCategories from 'src/flux/components/SchemaItemCategories'

interface Props {
  db: string
  source: Source
  timeRange: TimeRange
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
            <div
              className="flux-schema--expander" 
              data-test={`flux-schema-${this.className}`}
            />
            {db}
            <span className="flux-schema--type">Bucket</span>
          </div>
        </div>
        {this.categories}
      </div>
    )
  }

  private get categories(): JSX.Element {
    const {db, source, timeRange, notify} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    if (!isUnopen) {
      return (
        <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
          <SchemaExplorerTree
            bucket={db}
            source={source}
            timeRange={timeRange}
            key={db + ':' + timeRange.lower + ':' + timeRange.upper}
          >
            {tree => (
              <SchemaItemCategories
                db={db}
                source={source}
                timeRange={timeRange}
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
