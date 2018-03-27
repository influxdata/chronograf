import classnames from 'classnames'
import _ from 'lodash'
import React, {PureComponent} from 'react'

interface Tag {
    key: string
    value: string
}

interface Props {
    tagKey: string
    tagValues: string[]
    selectedTagValues: string[]
    onChooseTag: (tag: Tag) => void
    disabled: boolean
}

interface State {
    isOpen: boolean
}

class TagListItem extends PureComponent<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
            isOpen: true,
        }

        this.handleChoose = this.handleChoose.bind(this)
        this.handleClickKey = this.handleClickKey.bind(this)
    }

    public handleChoose(tagValue: string) {
        const {disabled, onChooseTag} = this.props

        if (!disabled) {
          onChooseTag({key: this.props.tagKey, value: tagValue})
        }
    }

    public handleClickKey() {
        this.setState({isOpen: !this.state.isOpen})
    }

    public renderTagValues() {
        const {tagValues, selectedTagValues} = this.props
        if (!tagValues || !tagValues.length) {
            return <div>no tag values</div>
        }

        return (
            <div className="query-builder--sub-list">
                {tagValues.map(v => {
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

    public render() {
        const {tagKey, tagValues} = this.props
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
                </div>
                {isOpen ? this.renderTagValues() : null}
            </div>
        )
    }
}

export default TagListItem
