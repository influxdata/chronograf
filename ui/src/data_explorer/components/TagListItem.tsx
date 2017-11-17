import * as React from 'react'
import * as _ from 'lodash'
import * as classnames from 'classnames'

import {eFunc} from 'src/types/funcs'

export interface TagListItemProps {
  tagKey: string
  tagValues: string[]
  selectedTagValues: string[]
  isUsingGroupBy?: boolean
  onChooseTag: eFunc
  onGroupByTag: eFunc
}

export interface TagListItemState {
  isOpen: boolean
  filterText: string
}

class TagListItem extends React.Component<TagListItemProps, TagListItemState> {
  private filterText

  public state = {
    isOpen: false,
    filterText: '',
  }

  private handleChoose = tagValue => {
    this.props.onChooseTag({key: this.props.tagKey, value: tagValue})
  }

  private handleClickKey = () => {
    this.setState({isOpen: !this.state.isOpen})
  }

  private handleFilterText = e => {
    e.stopPropagation()
    this.setState({
      filterText: this.filterText.value,
    })
  }

  private handleEscape = e => {
    if (e.key !== 'Escape') {
      return
    }

    e.stopPropagation()
    this.setState({
      filterText: '',
    })
  }

  private renderTagValues = () => {
    const {tagValues, selectedTagValues} = this.props
    if (!tagValues || !tagValues.length) {
      return <div>no tag values</div>
    }

    const filterText = this.state.filterText.toLowerCase()
    const filtered = tagValues.filter(v => v.toLowerCase().includes(filterText))

    return (
      <div className="query-builder--sub-list">
        <div className="query-builder--filter">
          <input
            className="form-control input-sm"
            ref={r => (this.filterText = r)}
            placeholder={`Filter within ${this.props.tagKey}`}
            type="text"
            value={this.state.filterText}
            onChange={this.handleFilterText}
            onKeyUp={this.handleEscape}
            spellCheck={false}
            autoComplete="false"
          />
          <span className="icon search" />
        </div>
        {filtered.map(v => {
          const cx = classnames('query-builder--list-item', {
            active: selectedTagValues.indexOf(v) > -1,
          })
          return (
            <div
              className={cx}
              onClick={_.wrap(v, this.handleChoose)}
              key={v}
              data-test={`query-builder-list-item-tag-value-${v}`}
            >
              <span>
                <div className="query-builder--checkbox" />
                {v}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  private handleGroupBy = e => {
    e.stopPropagation()
    this.props.onGroupByTag(this.props.tagKey)
  }

  public render() {
    const {tagKey, tagValues, isUsingGroupBy} = this.props
    const {isOpen} = this.state
    const tagItemLabel = `${tagKey} — ${tagValues.length}`

    return (
      <div>
        <div
          className={classnames('query-builder--list-item', {active: isOpen})}
          onClick={this.handleClickKey}
          data-test={`query-builder-list-item-tag-${tagKey}`}
        >
          <span>
            <div className="query-builder--caret icon caret-right" />
            {tagItemLabel}
          </span>
          <div
            className={classnames('btn btn-xs group-by-tag', {
              'btn-primary': isUsingGroupBy,
              'btn-default': !isUsingGroupBy,
            })}
            onClick={this.handleGroupBy}
          >
            Group By {tagKey}
          </div>
        </div>
        {isOpen ? this.renderTagValues() : null}
      </div>
    )
  }
}

export default TagListItem
