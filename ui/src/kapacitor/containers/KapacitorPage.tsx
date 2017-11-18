import * as React from 'react'
import {withRouter} from 'react-router-dom'

import {
  getKapacitor,
  createKapacitor,
  updateKapacitor,
  pingKapacitor,
} from 'shared/apis'
import KapacitorForm from 'src/kapacitor/components/KapacitorForm'
import {RouterID, Source} from 'src/types'
import {addFlashMessage as addFlashMessageType} from 'src/types/funcs'

const defaultName = 'My Kapacitor'
const kapacitorPort = '9092'

export interface KapacitorPageProps {
  source: Source
  addFlashMessage: addFlashMessageType
}

export interface KapacitorPageState {
  kapacitor: {
    url: string
    name: string
    username: string
    password: string
    links: {
      self: string
    }
    active: boolean
  }
  exists: boolean
}

class KapacitorPage extends React.Component<
  KapacitorPageProps & RouterID,
  KapacitorPageState
> {
  constructor(props: KapacitorPageProps & RouterID) {
    super(props)
    this.state = {
      kapacitor: {
        url: this._parseKapacitorURL(),
        name: defaultName,
        username: '',
        password: '',
        links: {
          self: '',
        },
        active: false,
      },
      exists: false,
    }
  }

  private checkKapacitorConnection = async kapacitor => {
    try {
      await pingKapacitor(kapacitor)
      this.setState({exists: true})
    } catch (error) {
      this.setState({exists: false})
      this.props.addFlashMessage({
        type: 'error',
        text: 'Could not connect to Kapacitor. Check settings.',
      })
    }
  }

  private handleInputChange = e => {
    const {value, name} = e.target

    this.setState(prevState => {
      const update = {[name]: value.trim()}
      return {kapacitor: {...prevState.kapacitor, ...update}}
    })
  }

  private handleSubmit = e => {
    e.preventDefault()
    const {
      addFlashMessage,
      source,
      source: {kapacitors = []},
      match,
      history,
    } = this.props
    const {kapacitor} = this.state

    const isNameTaken = kapacitors.some(k => k.name === kapacitor.name)
    const isNew = !match.params.id

    if (isNew && isNameTaken) {
      addFlashMessage({
        type: 'error',
        text: `There is already a Kapacitor configuration named "${
          kapacitor.name
        }"`,
      })
      return
    }

    if (match.params.id) {
      updateKapacitor(kapacitor)
        .then(({data}) => {
          this.setState({kapacitor: data})
          this.checkKapacitorConnection(data)
          addFlashMessage({type: 'success', text: 'Kapacitor Updated!'})
        })
        .catch(() => {
          addFlashMessage({
            type: 'error',
            text: 'There was a problem updating the Kapacitor record',
          })
        })
    } else {
      createKapacitor(source, kapacitor)
        .then(({data}) => {
          // need up update kapacitor with info from server to AlertOutputs
          this.setState({kapacitor: data})
          this.checkKapacitorConnection(data)
          history.push(`/sources/${source.id}/kapacitors/${data.id}/edit`)
          addFlashMessage({
            type: 'success',
            text: 'Kapacitor Created! Configuring endpoints is optional.',
          })
        })
        .catch(() => {
          addFlashMessage({
            type: 'error',
            text: 'There was a problem creating the Kapacitor record',
          })
        })
    }
  }

  private handleResetToDefaults = e => {
    e.preventDefault()
    const defaultState = {
      url: this._parseKapacitorURL(),
      name: defaultName,
      username: '',
      password: '',
      links: {
        self: '',
      },
      active: false,
    }

    this.setState({kapacitor: {...defaultState}})
  }

  private _parseKapacitorURL = () => {
    const parser = document.createElement('a')
    parser.href = this.props.source.url

    return `${parser.protocol}//${parser.hostname}:${kapacitorPort}`
  }

  public componentDidMount() {
    const {source, match: {params: {id}}} = this.props
    if (!id) {
      return
    }

    getKapacitor(source, id).then(kapacitor => {
      this.setState({kapacitor})
      this.checkKapacitorConnection(kapacitor)
    })
  }

  public render() {
    const {source, addFlashMessage} = this.props
    const {kapacitor, exists} = this.state

    return (
      <KapacitorForm
        onSubmit={this.handleSubmit}
        onInputChange={this.handleInputChange}
        onReset={this.handleResetToDefaults}
        kapacitor={kapacitor}
        source={source}
        addFlashMessage={addFlashMessage}
        exists={exists}
      />
    )
  }
}

export default withRouter<KapacitorPageProps>(KapacitorPage)
