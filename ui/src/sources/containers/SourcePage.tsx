import * as React from 'react'
import * as _ from 'lodash'
import * as qs from 'query-string'
import {withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import {compose} from 'redux'

import {getSource, createSource, updateSource} from 'shared/apis'
import {
  addSource as addSourceAction,
  updateSource as updateSourceAction,
} from 'shared/actions/sources'
import {publishNotification} from 'shared/actions/notifications'

import SourceForm from 'sources/components/SourceForm'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import SourceIndicator from 'shared/components/SourceIndicator'
import {DEFAULT_SOURCE} from 'shared/constants'
import {Source, History} from 'src/types'

const initialPath = '/sources/new'

export interface SourcePageProps {
  match: {
    params: {
      id: string
      sourceID: string
    }
  }
  history: History
  location: Location
  notify: (type: string, message: string) => void
  addSourceAction: typeof addSourceAction
  updateSourceAction: typeof updateSourceAction
}

export interface SourcePageState {
  isLoading: boolean
  isCreated: boolean
  source: {
    id: string
    url: string
    name: string
    username: string
    password: string
    default: boolean
    telegraf: string
    insecureSkipVerify: boolean
    metaUrl: string
    type?: string
    links: {
      proxy: string
      self: string
      kapacitors: string
      queries: string
      permissions: string
      users: string
      databases: string
      roles: string
    }
  }
  editMode: boolean
  isInitialSource: boolean
}

class SourcePage extends React.Component<SourcePageProps, SourcePageState> {
  constructor(props: SourcePageProps) {
    super(props)

    this.state = {
      isCreated: false,
      isLoading: true,
      source: DEFAULT_SOURCE,
      editMode: props.match.params.id !== undefined,
      isInitialSource: props.location.pathname === initialPath,
    }
  }

  public componentDidMount() {
    const {editMode} = this.state
    const {match} = this.props

    if (!editMode) {
      return this.setState({isLoading: false})
    }

    getSource(match.params.id)
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

  public handleInputChange = e => {
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

  public handleBlurSourceURL = () => {
    const {source, editMode} = this.state
    if (editMode) {
      this.setState(this._normalizeSource)
      return
    }

    if (!source.url) {
      return
    }

    this.setState(this._normalizeSource, this._createSourceOnBlur)
  }

  public handleSubmit = e => {
    e.preventDefault()
    const {isCreated, editMode} = this.state
    const isNewSource = !editMode

    if (!isCreated && isNewSource) {
      return this.setState(this._normalizeSource, this._createSource)
    }

    this.setState(this._normalizeSource, this._updateSource)
  }

  public handleError = (bannerText, err) => {
    const {notify} = this.props
    const error = this._parseError(err)
    console.error('Error: ', error)
    notify('error', `${bannerText}: ${error}`)
  }

  public _normalizeSource({source}: {source: Source}) {
    const url = source.url.trim()
    if (source.url.startsWith('http')) {
      return {source: {...source, url}}
    }
    return {source: {...source, url: `http://${url}`}}
  }

  public _createSourceOnBlur = () => {
    const {source} = this.state
    // if there is a type on source it has already been created
    if (source.type) {
      return
    }
    createSource(source)
      .then(({data: sourceFromServer}) => {
        addSourceAction(sourceFromServer)
        this.setState({
          source: {...DEFAULT_SOURCE, ...sourceFromServer},
          isCreated: true,
        })
      })
      .catch(err => {
        // dont want to flash this until they submit
        const error = this._parseError(err)
        console.error('Error on source creation: ', error)
      })
  }

  public _createSource = () => {
    const {source} = this.state
    createSource(source)
      .then(({data: sourceFromServer}) => {
        addSourceAction(sourceFromServer)
        this._redirect(sourceFromServer)
      })
      .catch(error => {
        this.handleError('Unable to create source', error)
      })
  }

  public _updateSource = () => {
    const {source} = this.state
    const {notify} = this.props
    updateSource(source)
      .then(({data: sourceFromServer}) => {
        updateSourceAction(sourceFromServer)
        this._redirect(sourceFromServer)
        notify('success', `New source ${source.name} added`)
      })
      .catch(error => {
        this.handleError('Unable to update source', error)
      })
  }

  public _redirect = source => {
    const {isInitialSource} = this.state
    const {match, history} = this.props

    if (isInitialSource) {
      return this._redirectToApp(source)
    }

    history.push(`/sources/${match.params.sourceID}/manage-sources`)
  }

  public _redirectToApp = source => {
    const {location, history} = this.props
    const {redirectPath} = qs.parse(location.search)

    if (!redirectPath) {
      return history.push(`/sources/${source.id}/hosts`)
    }

    const fixedPath = redirectPath.replace(
      /\/sources\/[^/]*/,
      `/sources/${source.id}`
    )
    return history.push(fixedPath)
  }

  public _parseError = error => {
    return _.get(error, ['data', 'message'], error)
  }

  public render() {
    const {isLoading, source, editMode, isInitialSource} = this.state

    if (isLoading) {
      return <div className="page-spinner" />
    }

    return (
      <div className={`${isInitialSource ? '' : 'page'}`}>
        {!isInitialSource && (
          <div className="page-header">
            <div className="page-header__container page-header__source-page">
              <div className="page-header__col-md-8">
                <div className="page-header__left">
                  <h1 className="page-header__title">
                    {editMode ? 'Edit Source' : 'Add a New Source'}
                  </h1>
                </div>
                <div className="page-header__right">
                  <SourceIndicator source={source as Source} />
                </div>
              </div>
            </div>
          </div>
        )}
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                <div className="panel panel-minimal">
                  <SourceForm
                    source={source}
                    editMode={editMode}
                    onInputChange={this.handleInputChange}
                    onSubmit={this.handleSubmit}
                    onBlurSourceURL={this.handleBlurSourceURL}
                  />
                </div>
              </div>
            </div>
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

export default compose(
  withRouter,
  connect(null, {
    notify: publishNotification,
    addSourceAction,
    updateSourceAction,
  })
)(SourcePage)
