import uuid from 'uuid'
import {PureComponent} from 'react'

import {AutoRefresher} from 'src/utils/AutoRefresher'

interface Props {
  autoRefresh?: AutoRefresher
  manualRefresh?: number
  children: (uuid: string) => JSX.Element | JSX.Element[]
}

interface State {
  id: string
  manualRefresh: number
}

export default class AutoRefresh extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(nextProps: Props, state: State) {
    if (state.manualRefresh !== nextProps.manualRefresh) {
      return {
        id: uuid.v4(),
        manualRefresh: nextProps.manualRefresh,
      }
    }

    return false
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      manualRefresh: props.manualRefresh,
      id: uuid.v4(),
    }
  }

  public render() {
    return this.props.children(this.state.id)
  }

  public componentDidMount() {
    const {autoRefresh} = this.props

    if (autoRefresh) {
      autoRefresh.subscribe(this.update)
    }
  }

  public componentWillUnmount() {
    const {autoRefresh} = this.props

    if (autoRefresh) {
      autoRefresh.unsubscribe(this.update)
    }
  }

  private update = () => {
    this.setState({id: uuid.v4()})
  }
}
