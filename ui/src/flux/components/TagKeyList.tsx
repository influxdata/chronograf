// Libraries
import React, {PureComponent, ChangeEvent, MouseEvent} from 'react'

// Components
import TagKeyListItem from 'src/flux/components/TagKeyListItem'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  measurement?: string
  source: Source
  tagKeys: string[]
  notify: NotificationAction
}

interface State {
  searchTerm: string
}

@ErrorHandling
class TagKeyList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    const {measurement} = this.props
    const {searchTerm} = this.state

    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder={`Filter within ${measurement || 'Tags'}`}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleClick}
            onChange={this.onSearch}
          />
        </div>
        {this.tagKeys}
      </>
    )
  }

  private get tagKeys(): JSX.Element | JSX.Element[] {
    const {db, source, notify, measurement} = this.props
    const {searchTerm} = this.state

    const excludedTagKeys = ['_measurement', '_field']
    const term = searchTerm.toLocaleLowerCase()
    const tagKeys = this.props.tagKeys.filter(
      tk =>
        !excludedTagKeys.includes(tk) && tk.toLocaleLowerCase().includes(term)
    )
    if (tagKeys.length) {
      return tagKeys.map(tagKey => (
        <TagKeyListItem
          db={db}
          source={source}
          searchTerm={searchTerm}
          tagKey={tagKey}
          measurement={measurement}
          key={tagKey}
          notify={notify}
        />
      ))
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag keys.</div>
        </div>
      </div>
    )
  }

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  private handleClick = (e: MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }
}

export default TagKeyList
