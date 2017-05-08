import React, {Component, PropTypes} from 'react'
import {withRouter} from 'react-router'

import {
  getKapacitor,
  createKapacitor,
  updateKapacitor,
  pingKapacitor,
} from 'shared/apis'
import KapacitorForm from '../components/KapacitorForm'

const defaultName = 'My Kapacitor'
const kapacitorPort = '9092'

class KapacitorPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      kapacitor: {
        url: this._parseKapacitorURL(),
        name: defaultName,
        username: '',
        password: '',
      },
      exists: false,
    }

    this.handleInputChange = ::this.handleInputChange
    this.handleSubmit = ::this.handleSubmit
    this.handleResetToDefaults = ::this.handleResetToDefaults
    this._parseKapacitorURL = ::this._parseKapacitorURL
  }

  componentDidMount() {
    const {source, params: {id}} = this.props
    if (!id) {
      return
    }

    getKapacitor(source, id).then(kapacitor => {
      this.setState({kapacitor, exists: true}, () => {
        pingKapacitor(kapacitor).catch(() => {
          this.props.addFlashMessage({
            type: 'error',
            text: 'Could not connect to Kapacitor. Check settings.',
          })
        })
      })
    })
  }

  handleInputChange(e) {
    const {value, name} = e.target

    this.setState(prevState => {
      const update = {[name]: value.trim()}
      return {kapacitor: {...prevState.kapacitor, ...update}}
    })
  }

  handleSubmit(e) {
    e.preventDefault()
    const {addFlashMessage, source, params, router} = this.props
    const {kapacitor} = this.state

    if (params.id) {
      updateKapacitor(kapacitor)
        .then(() => {
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
          router.push(`/sources/${source.id}/kapacitors/${data.id}/edit`)
          this.setState({kapacitor: data, exists: true})
          addFlashMessage({type: 'success', text: 'Kapacitor Created!'})
        })
        .catch(() => {
          addFlashMessage({
            type: 'error',
            text: 'There was a problem creating the Kapacitor record',
          })
        })
    }
  }

  handleResetToDefaults(e) {
    e.preventDefault()
    const defaultState = {
      url: this._parseKapacitorURL(),
      name: defaultName,
      username: '',
      password: '',
    }

    this.setState({kapacitor: {...defaultState}})
  }

  _parseKapacitorURL() {
    const parser = document.createElement('a')
    parser.href = this.props.source.url

    return `${parser.protocol}//${parser.hostname}:${kapacitorPort}`
  }

  render() {
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

const {func, shape, string} = PropTypes

KapacitorPage.propTypes = {
  addFlashMessage: func,
  params: shape({
    id: string,
  }).isRequired,
  router: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  source: shape({
    id: string.isRequired,
    url: string.isRequired,
  }),
}

export default withRouter(KapacitorPage)
