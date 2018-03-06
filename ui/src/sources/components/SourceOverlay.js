import React, {PropTypes, Component} from 'react'
import {withRouter} from 'react-router'
import _ from 'lodash'
import {getSource} from 'shared/apis'
import {createSource, updateSource} from 'shared/apis'
import {
  addSource as addSourceAction,
  updateSource as updateSourceAction,
} from 'shared/actions/sources'
import {publishNotification} from 'shared/actions/notifications'
import {connect} from 'react-redux'

import SourceForm from 'src/sources/components/SourceForm'
import {DEFAULT_SOURCE} from 'shared/constants'

class SourceOverlay extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isLoading: true,
      source: DEFAULT_SOURCE,
    }
  }

  componentDidMount() {
    const {sourceID, editMode} = this.props

    if (!editMode) {
      return this.setState({isLoading: false})
    }

    getSource(sourceID)
      .then(({data: source}) => {
        this.setState({
          source: {...DEFAULT_SOURCE, ...source},
          isLoading: false,
        })
      })
      .catch(error => {
        this.handleError('Could not connect to source', error)
        this.setState({isLoading: false})
      })
  }

  handleInputChange = e => {
    let val = e.target.value
    const name = e.target.name

    if (e.target.type === 'checkbox') {
      val = e.target.checked
    }

    this.setState(prevState => {
      const source = {
        ...prevState.source,
        [name]: val,
      }

      return {...prevState, source}
    })
  }

  handleBlurSourceURL = () => {
    const {source} = this.state
    const {editMode} = this.props

    if (editMode) {
      this.setState(this._normalizeSource)
      return
    }

    if (!source.url) {
      return
    }

    this.setState(this._normalizeSource, this._createSourceOnBlur)
  }

  handleSubmit = e => {
    e.preventDefault()
    const {isCreated} = this.state
    const {editMode} = this.props

    const isNewSource = !editMode

    if (!isCreated && isNewSource) {
      return this.setState(this._normalizeSource, this._createSource)
    }

    this.setState(this._normalizeSource, this._updateSource)
  }

  handleError = (bannerText, err) => {
    const {notify} = this.props
    const error = this._parseError(err)
    console.error('Error: ', error)
    notify('error', `${bannerText}: ${error}`)
  }

  _normalizeSource({source}) {
    const url = source.url.trim()
    if (source.url.startsWith('http')) {
      return {source: {...source, url}}
    }
    return {source: {...source, url: `http://${url}`}}
  }

  _createSourceOnBlur = () => {
    const {source} = this.state
    // if there is a type on source it has already been created
    if (source.type) {
      return
    }
    createSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.addSourceAction(sourceFromServer)
        this.setState({
          source: {...DEFAULT_SOURCE, ...sourceFromServer},
          isCreated: true,
        })
      })
      .catch(err => {
        // dont want to flash this until they submit
        const error = this._parseError(err)
        console.error('Error creating InfluxDB connection: ', error)
      })
  }

  _createSource = () => {
    const {source} = this.state
    const {notify, onDismissOverlay} = this.props
    createSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.addSourceAction(sourceFromServer)
        notify('success', `InfluxDB ${source.name} available as a connection`)
        onDismissOverlay()
      })
      .catch(error => {
        this.handleError('Unable to create InfluxDB connection', error)
      })
  }

  _updateSource = () => {
    const {source} = this.state
    const {notify, onDismissOverlay} = this.props
    updateSource(source)
      .then(({data: sourceFromServer}) => {
        this.props.updateSourceAction(sourceFromServer)
        notify('success', `InfluxDB connection ${source.name} updated`)
        onDismissOverlay()
      })
      .catch(error => {
        this.handleError('Unable to update InfluxDB connection', error)
      })
  }

  _parseError = error => {
    return _.get(error, ['data', 'message'], error)
  }

  render() {
    const {isLoading, source} = this.state
    const {onDismissOverlay, editMode} = this.props

    if (isLoading) {
      return <div className="page-spinner" />
    }

    return (
      <div className="overlay">
        <div className="overlay-header">
          <h2 className="overlay-title">
            {editMode
              ? 'Configure InfluxDB Connection'
              : 'Add a New InfluxDB Connection'}
          </h2>
          <button className="overlay-dismiss" onClick={onDismissOverlay} />
        </div>
        <div className="overlay-body">
          <SourceForm
            source={source}
            editMode={editMode}
            onInputChange={this.handleInputChange}
            onSubmit={this.handleSubmit}
            onBlurSourceURL={this.handleBlurSourceURL}
          />
        </div>
      </div>
    )
  }
}

const {bool, func, string} = PropTypes

SourceOverlay.propTypes = {
  sourceID: string.isRequired,
  editMode: bool,
  notify: func,
  addSourceAction: func,
  updateSourceAction: func,
  onDismissOverlay: func.isRequired,
}

const mapStateToProps = () => ({})

export default connect(mapStateToProps, {
  notify: publishNotification,
  addSourceAction,
  updateSourceAction,
})(withRouter(SourceOverlay))
