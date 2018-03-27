import React, {Component} from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import TagListItem from 'src/loudml/components/TagListItem';

import {showTagKeys, showTagValues} from 'shared/apis/metaQuery'

import showTagKeysParser from 'shared/parsing/showTagKeys'
import showTagValuesParser from 'shared/parsing/showTagValues'

class FeatureTags extends Component {
    constructor(props) {
        super(props)

        this.state = {
            tags: []
        }

    }

    componentDidMount() {
        const {database, measurement, retentionPolicy} = this.props
        if (!database || !measurement || !retentionPolicy) {
            return
        }
    
        this.getTags()
      }
    
    componentDidUpdate(prevProps) {
        const {source, database, measurement, retentionPolicy} = this.props
    
        if (!database || !measurement || !retentionPolicy) {
            return
        }
    
        if (
            database === prevProps.database &&
            measurement === prevProps.measurement &&
            retentionPolicy === prevProps.retentionPolicy &&
            _.isEqual(prevProps.source, source)
        ) {
            return
        }
    
        this.getTags()
      }
    

    getTags = async () => {
        const {
            source: {links: {proxy}},
            database,
            measurement,
            retentionPolicy
        } = this.props
    
        const {data} = await showTagKeys({
            database,
            measurement,
            retentionPolicy,
            source: proxy,
        })
        const {tagKeys} = showTagKeysParser(data)
    
        if (tagKeys.length===0) {
            return this.setState({tags: []})
        }

        const response = await showTagValues({
            database,
            measurement,
            retentionPolicy,
            source: proxy,
            tagKeys,
        })
        
        const {tags} = showTagValuesParser(response.data)
        
        this.setState({tags})

    }
    
    render() {
        const {tags, onChooseTag, disabled} = this.props

        return (
            <div className="query-builder--sub-list">
                {_.map(this.state.tags, (tagValues, tagKey) => (
                    <TagListItem
                        key={tagKey}
                        tagKey={tagKey}
                        tagValues={tagValues}
                        onChooseTag={onChooseTag}
                        selectedTagValues={
                            tags
                                .filter(t => t.tag === tagKey)
                                .map(t => (t.value))}
                        disabled={disabled}
                    />
                ))}
            </div>
        )
    }
}

const {arrayOf, func, shape, string, bool} = PropTypes

FeatureTags.propTypes = {
    tags: arrayOf(shape({})),
    onChooseTag: func.isRequired,
    database: string,
    measurement: string,
    retentionPolicy: string,
    source: shape(),
    disabled: bool,
}

export default FeatureTags
