import * as React from 'react'
import * as _ from 'lodash'

import TagListItem from './TagListItem'

import {showTagKeys, showTagValues} from 'shared/apis/metaQuery'
import showTagKeysParser from 'shared/parsing/showTagKeys'
import showTagValuesParser from 'shared/parsing/showTagValues'

import {QueryConfig, QuerySource, Source, Tags} from 'src/types'
import {eFunc} from 'src/types/funcs'

export interface TagListProps {
  source: Source
  query: QueryConfig
  querySource: QuerySource
  onChooseTag: eFunc
  onGroupByTag: eFunc
}

export interface TagListState {
  tags: Tags
}

class TagList extends React.Component<TagListProps, TagListState> {
  public state = {
    tags: {},
  }

  public _getTags = () => {
    const {database, measurement, retentionPolicy} = this.props.query
    const {querySource, source} = this.props

    const proxy =
      _.get(querySource, ['links', 'proxy'], null) || source.links.proxy

    showTagKeys({source: proxy, database, retentionPolicy, measurement})
      .then(resp => {
        const {errors, tagKeys} = showTagKeysParser(resp.data)
        if (errors.length) {
          // do something
        }

        return showTagValues({
          source: proxy,
          database,
          retentionPolicy,
          measurement,
          tagKeys,
        })
      })
      .then(resp => {
        const {errors: errs, tags} = showTagValuesParser(resp.data)
        if (errs.length) {
          // do something
        }

        this.setState({tags})
      })
  }

  public componentDidMount() {
    const {database, measurement, retentionPolicy} = this.props.query
    if (!database || !measurement || !retentionPolicy) {
      return
    }

    this._getTags()
  }

  public componentDidUpdate(prevProps: TagListProps) {
    const {query, querySource} = this.props
    const {database, measurement, retentionPolicy} = query

    const {
      database: prevDB,
      measurement: prevMeas,
      retentionPolicy: prevRP,
    } = prevProps.query
    if (!database || !measurement || !retentionPolicy) {
      return
    }

    if (
      database === prevDB &&
      measurement === prevMeas &&
      retentionPolicy === prevRP &&
      _.isEqual(prevProps.querySource, querySource)
    ) {
      return
    }

    this._getTags()
  }

  public render() {
    const {query} = this.props

    return (
      <div className="query-builder--sub-list">
        {_.map(this.state.tags, (tagValues: string[], tagKey) => {
          return (
            <TagListItem
              key={tagKey}
              tagKey={tagKey}
              tagValues={tagValues}
              selectedTagValues={query.tags[tagKey] || []}
              isUsingGroupBy={query.groupBy.tags.indexOf(tagKey) > -1}
              onChooseTag={this.props.onChooseTag}
              onGroupByTag={this.props.onGroupByTag}
            />
          )
        })}
      </div>
    )
  }
}

export default TagList
