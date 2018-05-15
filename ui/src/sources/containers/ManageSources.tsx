import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { ErrorHandling } from 'src/shared/decorators/errors'

import {
  removeAndLoadSources,
  fetchKapacitorsAsync,
  setActiveKapacitorAsync,
  deleteKapacitorAsync,
} from 'src/shared/actions/sources'
import { notify as notifyAction } from 'src/shared/actions/notifications'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import SourceIndicator from 'src/shared/components/SourceIndicator'
import InfluxTable from 'src/sources/components/InfluxTable'

import {
  notifySourceDeleted,
  notifySourceDeleteFailed,
} from 'src/shared/copy/notifications'

import { Source } from 'src/types'

interface Props {
  source: Source
  sources: Source[]
  notify: () => void
  remoteAndLoadSources: () => void
  fetchKapacitors: () => void
  setActiveKapacitor: () => void
  deleteKapacitor: () => void
}

const V_NUMBER = VERSION // eslint-disable-line no-undef

@ErrorHandling
class ManageSources extends Component<Props, any> {
  constructor(props) {
    super(props)
  }

  public componentDidMount() {
    this.props.sources.forEach(source => {
      this.props.fetchKapacitors(source)
    })
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.sources.length !== this.props.sources.length) {
      this.props.sources.forEach(source => {
        this.props.fetchKapacitors(source)
      })
    }
  }

  public render() {
    const { sources, source, deleteKapacitor } = this.props

    return (
      <div className="page" id="manage-sources-page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1 className="page-header__title">Configuration</h1>
            </div>
            <div className="page-header__right">
              <SourceIndicator />
            </div>
          </div>
        </div>
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <InfluxTable
              source={source}
              sources={sources}
              handleDeleteKapacitor={deleteKapacitor}
              handleDeleteSource={this.handleDeleteSource}
              setActiveKapacitor={this.handleSetActiveKapacitor}
            />
            <p className="version-number">
              Chronograf Version: {V_NUMBER}
            </p>
          </div>
        </FancyScrollbar>
      </div>
    )
  }

  private handleDeleteSource = (source: Source) => () => {
    const { notify } = this.props

    try {
      this.props.removeAndLoadSources(source)
      notify(notifySourceDeleted(source.name))
    } catch (e) {
      notify(notifySourceDeleteFailed(source.name))
    }
  }

  private handleSetActiveKapacitor = ({ kapacitor }) => {
    this.props.setActiveKapacitor(kapacitor)
  }
}

const mapStateToProps = ({ sources }) => ({
  sources,
})

const mapDispatchToProps = dispatch => ({
  removeAndLoadSources: bindActionCreators(removeAndLoadSources, dispatch),
  fetchKapacitors: bindActionCreators(fetchKapacitorsAsync, dispatch),
  setActiveKapacitor: bindActionCreators(setActiveKapacitorAsync, dispatch),
  deleteKapacitor: bindActionCreators(deleteKapacitorAsync, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(ManageSources)
