// Libraries
import {PureComponent} from 'react'

// Utils
import parseValuesColumn from 'src/shared/parsing/flux/values'
import {tagKeys as fetchTagKeysAsync} from 'src/shared/apis/flux/metaQueries'

// Types
import {Source, RemoteDataState} from 'src/types'

interface Props {
  source: Source
  bucket: string
  children: (tagKeys, tagsLoading) => JSX.Element
}

interface State {
  tagKeys: string[]
  loading: RemoteDataState
}

class FetchTagKeys extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      tagKeys: [],
      loading: RemoteDataState.NotStarted,
    }
  }

  public componentDidMount() {
    this.fetchTagKeys()
  }

  public render() {
    return this.props.children(this.state.tagKeys, this.state.loading)
  }

  private async fetchTagKeys() {
    const {source, bucket} = this.props
    this.setState({loading: RemoteDataState.Loading})
    try {
      const tagKeysResults = await fetchTagKeysAsync(source, bucket, [])

      const tagKeys = parseValuesColumn(tagKeysResults)

      this.setState({tagKeys, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }
}

export default FetchTagKeys
