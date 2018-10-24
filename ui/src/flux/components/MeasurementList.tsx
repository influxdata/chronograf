// Libraries
import React, {PureComponent, MouseEvent, ChangeEvent} from 'react'

// Components
import MeasurementListItem from 'src/flux/components/MeasurementListItem'
import LoaderSkeleton from 'src/flux/components/LoaderSkeleton'

// apis
import {measurements as fetchMeasurements} from 'src/shared/apis/flux/metaQueries'

// Utils
import parseValuesColumn from 'src/shared/parsing/flux/values'
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction, RemoteDataState} from 'src/types'

interface Props {
  db: string
  source: Source
  notify: NotificationAction
}

interface State {
  searchTerm: string
  measurements: string[]
  loading: RemoteDataState
}

@ErrorHandling
class TagValueList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      measurements: [],
      searchTerm: '',
      loading: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    this.setState({loading: RemoteDataState.Loading})
    try {
      const measurements = await this.fetchMeasurements()
      this.setState({measurements, loading: RemoteDataState.Done})
    } catch (error) {
      this.setState({loading: RemoteDataState.Error})
    }
  }

  public render() {
    const {searchTerm} = this.state

    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder="Filter within Measurements"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleClick}
            onChange={this.onSearch}
          />
        </div>
        {this.measurements}
      </>
    )
  }

  private get measurements(): JSX.Element | JSX.Element[] {
    const {source, db, notify} = this.props
    const {searchTerm, loading} = this.state

    if (loading === RemoteDataState.Loading) {
      return <LoaderSkeleton />
    }
    const term = searchTerm.toLocaleLowerCase()
    const measurements = this.state.measurements.filter(m =>
      m.toLocaleLowerCase().includes(term)
    )
    if (measurements.length) {
      return measurements.map(measurement => (
        <MeasurementListItem
          source={source}
          db={db}
          searchTerm={searchTerm}
          measurement={measurement}
          key={measurement}
          notify={notify}
        />
      ))
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more measurements.</div>
        </div>
      </div>
    )
  }

  private async fetchMeasurements(): Promise<string[]> {
    const {source, db} = this.props

    const response = await fetchMeasurements(source, db)
    const measurements = parseValuesColumn(response)
    console.log('fetched measurements: ', measurements)
    return measurements
  }

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  private handleClick = (e: MouseEvent<HTMLInputElement | HTMLDivElement>) => {
    e.stopPropagation()
  }
}

export default TagValueList
