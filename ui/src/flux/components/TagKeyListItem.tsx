// Libraries
import React, {PureComponent} from 'react'

// Components
import TagValueList from 'src/flux/components/TagValueList'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'

// Constants
import {OpenState} from 'src/flux/constants/explorer'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  source: Source
  tagKey: string
  notify: NotificationAction
  onAddFilter?: (value: {[k: string]: string}) => void
}

interface State {
  opened: OpenState
}

@ErrorHandling
class TagKeyListItem extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      opened: OpenState.UNOPENED,
    }
  }

  public render() {
    const {db, source, tagKey, notify} = this.props
    const {opened} = this.state
    const isOpen = opened === OpenState.OPENED
    const isUnopen = opened === OpenState.UNOPENED

    return (
      <div
        className={`flux-schema-tree flux-schema--child ${
          isOpen ? 'expanded' : ''
        }`}
        key={tagKey}
        onClick={this.handleItemClick}
      >
        <div className="flux-schema--item">
          <div className="flex-schema-item-group flux-schema-item--expandable">
            <div className="flux-schema--expander" />
            {tagKey}
            <span className="flux-schema--type">Tag Key</span>
          </div>
        </div>
        {!isUnopen && (
          <div className={`flux-schema--children ${isOpen ? '' : 'hidden'}`}>
            <TagValueList
              db={db}
              source={source}
              tagKey={tagKey}
              notify={notify}
              onAddFilter={this.props.onAddFilter}
            />
          </div>
        )}
      </div>
    )
  }

  private handleItemClick = (e): void => {
    e.stopPropagation()

    const opened = this.state.opened

    if (opened === OpenState.OPENED) {
      this.setState({opened: OpenState.ClOSED})
      return
    }
    this.setState({opened: OpenState.OPENED})
  }
}

export default TagKeyListItem
