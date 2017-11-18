import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {
  removeAndLoadSources,
  fetchKapacitorsAsync,
  setActiveKapacitorAsync,
  deleteKapacitorAsync,
} from 'shared/actions/sources'

import FancyScrollbar from 'shared/components/FancyScrollbar'
import SourceIndicator from 'shared/components/SourceIndicator'
import InfluxTable from 'sources/components/InfluxTable'

const V_NUMBER = process.env.VERSION // eslint-disable-line no-undef

import {Source} from 'src/types'
import {addFlashMessage as addFlashMessageType} from 'src/types/funcs'

export interface ManageSourcesProps {
  source: Source
  sources: Source[]
  addFlashMessage: addFlashMessageType
  removeAndLoadSources: typeof removeAndLoadSources
  fetchKapacitors: typeof fetchKapacitorsAsync
  setActiveKapacitor: typeof setActiveKapacitorAsync
  deleteKapacitor: typeof deleteKapacitorAsync
}

class ManageSources extends React.Component<ManageSourcesProps> {
  private handleDeleteSource = source => () => {
    const {addFlashMessage} = this.props

    try {
      this.props.removeAndLoadSources(source)
    } catch (e) {
      addFlashMessage({
        type: 'error',
        text: 'Could not remove source from Chronograf',
      })
    }
  }

  private handleSetActiveKapacitor = ({kapacitor}) => {
    this.props.setActiveKapacitor(kapacitor)
  }

  public componentDidMount() {
    this.props.sources.forEach(source => {
      this.props.fetchKapacitors(source)
    })
  }

  public componentDidUpdate(prevProps: ManageSourcesProps) {
    if (prevProps.sources.length !== this.props.sources.length) {
      this.props.sources.forEach(source => {
        this.props.fetchKapacitors(source)
      })
    }
  }

  public render() {
    const {sources, source, deleteKapacitor} = this.props

    return (
      <div className="page" id="manage-sources-page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1 className="page-header__title">Configuration</h1>
            </div>
            <div className="page-header__right">
              <SourceIndicator source={source} />
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
            <p className="version-number">Chronograf Version: {V_NUMBER}</p>
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = dispatch => ({
  removeAndLoadSources: bindActionCreators(removeAndLoadSources, dispatch),
  fetchKapacitors: bindActionCreators(fetchKapacitorsAsync, dispatch),
  setActiveKapacitor: bindActionCreators(setActiveKapacitorAsync, dispatch),
  deleteKapacitor: bindActionCreators(deleteKapacitorAsync, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(ManageSources)
