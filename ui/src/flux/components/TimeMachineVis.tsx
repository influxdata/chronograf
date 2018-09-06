import React, {PureComponent} from 'react'

import FluxGraph from 'src/flux/components/FluxGraph'
import LoadingSpinner from 'src/flux/components/LoadingSpinner'
import TimeMachineTables from 'src/flux/components/TimeMachineTables'

import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'

import {getTimeSeries} from 'src/flux/apis'

import {Service, FluxTable, RemoteDataState} from 'src/types'
import {VisType} from 'src/types/flux'

const FETCH_NEW_DATA_DELAY = 1000 // ms

interface Props {
  script: string
  service: Service
  debouncer?: Debouncer
  visType: VisType
}

interface State {
  data: FluxTable[]
  dataStatus: RemoteDataState
}

class TimeMachineVis extends PureComponent<Props, State> {
  private debouncer: Debouncer

  constructor(props: Props) {
    super(props)

    this.debouncer = props.debouncer || new DefaultDebouncer()
    this.state = {
      data: [],
      dataStatus: RemoteDataState.NotStarted,
    }
  }

  public componentDidMount() {
    this.getData()
  }

  public componentDidUpdate(prevProps) {
    if (this.props.script !== prevProps.script) {
      this.setState({dataStatus: RemoteDataState.Loading})
      this.debouncer.call(this.getData, FETCH_NEW_DATA_DELAY)
    }
  }

  public render() {
    const {visType} = this.props
    const {data, dataStatus} = this.state

    if (dataStatus === RemoteDataState.Error) {
      return (
        <div className="time-machine-vis">
          <p>Data failed to load</p>
        </div>
      )
    }

    if (dataStatus === RemoteDataState.Loading) {
      return (
        <div className="time-machine-vis">
          <LoadingSpinner />
        </div>
      )
    }

    return (
      <div className="time-machine-vis">
        {visType === VisType.Graph ? (
          <FluxGraph data={data} />
        ) : (
          <TimeMachineTables data={data} />
        )}
      </div>
    )
  }

  private getData = async (): Promise<void> => {
    const {script, service} = this.props

    try {
      const resp = await getTimeSeries(service, script)

      this.setState({data: resp.tables, dataStatus: RemoteDataState.Done})
    } catch (e) {
      this.setState({dataStatus: RemoteDataState.Error})
    }
  }
}

export default TimeMachineVis
