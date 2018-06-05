import React, {PureComponent} from 'react'
import {tagKeys as fetchTagKeys} from 'src/shared/apis/flux/metaQueries'
import parseValuesColumn from 'src/shared/parsing/flux/values'
import TagList from 'src/flux/components/TagList'

import {Service} from 'src/types'

interface Props {
  db: string
  service: Service
}

interface State {
  tagKeys: string[]
}

class FilterArgs extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      tagKeys: [],
    }
  }

  public async componentDidMount() {
    const {db, service} = this.props

    try {
      const response = await fetchTagKeys(service, db, [])
      const tagKeys = parseValuesColumn(response)
      this.setState({tagKeys})
    } catch (error) {
      console.error(error)
    }
  }

  public render() {
    const {db, service} = this.props

    return (
      <TagList
        db={db}
        service={service}
        tags={this.state.tagKeys}
        filter={[]}
      />
    )
  }
}

export default FilterArgs
