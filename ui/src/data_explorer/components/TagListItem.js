import React, {PropTypes} from 'react'
import _ from 'lodash'
import classNames from 'classnames'

const {string, arrayOf, func, bool} = PropTypes
const TagListItem = React.createClass({
  propTypes: {
    tagKey: string.isRequired,
    tagValues: arrayOf(string.isRequired).isRequired,
    selectedTagValues: arrayOf(string.isRequired).isRequired,
    isUsingGroupBy: bool,
    onChooseTag: func.isRequired,
    onGroupByTag: func.isRequired,
  },

  getInitialState() {
    return {
      isOpen: false,
      filterText: '',
    }
  },

  handleChoose(tagValue) {
    this.props.onChooseTag({key: this.props.tagKey, value: tagValue})
  },

  handleClickKey() {
    this.setState({isOpen: !this.state.isOpen})
  },

  handleFilterText(e) {
    e.stopPropagation()
    this.setState({
      filterText: this.refs.filterText.value,
    })
  },

  handleEscape(e) {
    if (e.key !== 'Escape') {
      return
    }

    e.stopPropagation()
    this.setState({
      filterText: '',
    })
  },

  renderTagValues() {
    const {tagValues, selectedTagValues} = this.props
    if (!tagValues || !tagValues.length) {
      return <div>no tag values</div>
    }

    const filtered = tagValues.filter((v) => v.match(this.state.filterText))

    return (
      <li>
        <div className="tag-value-list__filter-container">
          <input className="tag-value-list__filter" ref="filterText" placeholder={`Filter within ${this.props.tagKey}`} type="text" value={this.state.filterText} onChange={this.handleFilterText} onKeyUp={this.handleEscape} />
          <span className="icon search"></span>
        </div>
        <ul className="tag-value-list">
          {filtered.map((v) => {
            const cx = classNames('tag-value-list__item qeditor--list-item', {active: selectedTagValues.indexOf(v) > -1})
            return (
              <li className={cx} onClick={_.wrap(v, this.handleChoose)} key={v}>
                <div className="tag-value-list__checkbox"></div>
                <div className="tag-value-list__item-label">{v}</div>
              </li>
            )
          })}
        </ul>
      </li>
    )
  },

  handleGroupBy(e) {
    e.stopPropagation()
    this.props.onGroupByTag(this.props.tagKey)
  },

  render() {
    const {tagKey, tagValues} = this.props
    const {isOpen} = this.state
    const itemClasses = classNames("qeditor--list-item tag-list__item", {open: isOpen})

    return (
      <div>
        <li className={itemClasses} onClick={this.handleClickKey}>
          <div className="tag-list__title">
            <div className="tag-list__caret">
              <div className="icon caret-right"></div>
            </div>
            {tagKey}
            <span className="badge">{tagValues.length}</span>
          </div>
          <div
            className={classNames('btn btn-info btn-xs tag-list__group-by', {active: this.props.isUsingGroupBy})}
            onClick={this.handleGroupBy}>Group By {tagKey}
          </div>
        </li>
        {isOpen ? this.renderTagValues() : null}
      </div>
    )
  },
})

export default TagListItem
