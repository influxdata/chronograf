import React, {PureComponent} from 'react'
import {tagKeys as fetchTagKeys} from 'src/shared/apis/flux/metaQueries'
import parseValuesColumn from 'src/shared/parsing/flux/values'
import FilterTagList from 'src/flux/components/FilterTagList'

import {Service} from 'src/types'
import {OnChangeArg, Func} from 'src/types/flux'

interface Props {
  func: Func
  bodyID: string
  declarationID: string
  onChangeArg: OnChangeArg
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
    const {db, service, onChangeArg, func, bodyID, declarationID} = this.props

    return (
      <FilterTagList
        db={db}
        service={service}
        tags={this.state.tagKeys}
        filter={[]}
        onChangeArg={onChangeArg}
        func={func}
        bodyID={bodyID}
        declarationID={declarationID}
      />
    )
  }
}

export default FilterArgs
