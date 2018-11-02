import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {ErrorHandling} from 'src/shared/decorators/errors'

import * as sourcesActions from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {Page} from 'src/reusable_ui'
import InfluxTable from 'src/sources/components/InfluxTable'
import ConnectionWizard from 'src/sources/components/ConnectionWizard'

import {
  notifySourceDeleted,
  notifySourceDeleteFailed,
} from 'src/shared/copy/notifications'

import {Source, Notification} from 'src/types'
import {ToggleWizard} from 'src/types/wizard'

interface State {
  wizardVisibility: boolean
  sourceInWizard: Source
  jumpStep: number
  showNewKapacitor: boolean
}

interface Props {
  source: Source
  sources: Source[]
  notify: (n: Notification) => void
  deleteKapacitor: sourcesActions.DeleteKapacitorAsync
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  removeAndLoadSources: sourcesActions.RemoveAndLoadSources
  setActiveKapacitor: sourcesActions.SetActiveKapacitorAsync
}

const VERSION = process.env.npm_package_version

@ErrorHandling
class ManageSources extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      wizardVisibility: false,
      sourceInWizard: null,
      jumpStep: null,
      showNewKapacitor: null,
    }
  }

  public componentDidMount() {
    this.fetchKapacitors()
  }

  public componentDidUpdate(prevProps: Props) {
    if (prevProps.sources.length !== this.props.sources.length) {
      this.props.sources.forEach(source => {
        this.props.fetchKapacitors(source)
      })
    }
  }

  public render() {
    const {sources, source, deleteKapacitor} = this.props
    const {
      wizardVisibility,
      sourceInWizard,
      jumpStep,
      showNewKapacitor,
    } = this.state
    return (
      <Page>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="Configuration" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true} />
        </Page.Header>
        <Page.Contents>
          <InfluxTable
            source={source}
            sources={sources}
            deleteKapacitor={deleteKapacitor}
            onDeleteSource={this.handleDeleteSource}
            setActiveKapacitor={this.handleSetActiveKapacitor}
            toggleWizard={this.toggleWizard}
          />
          <p className="version-number">Chronograf Version: {VERSION}</p>
        </Page.Contents>
        <ConnectionWizard
          isVisible={wizardVisibility}
          toggleVisibility={this.toggleWizard}
          source={sourceInWizard}
          jumpStep={jumpStep}
          showNewKapacitor={showNewKapacitor}
        />
      </Page>
    )
  }

  private handleDeleteSource = (source: Source) => {
    const {notify} = this.props

    try {
      this.props.removeAndLoadSources(source)
      notify(notifySourceDeleted(source.name))
    } catch (e) {
      notify(notifySourceDeleteFailed(source.name))
    }
  }

  private fetchKapacitors = () => {
    this.props.sources.forEach(source => {
      this.props.fetchKapacitors(source)
    })
  }

  private toggleWizard: ToggleWizard = (
    isVisible,
    source = null,
    jumpStep = null,
    showNewKapacitor = null
  ) => () => {
    if (!isVisible) {
      this.fetchKapacitors()
    }
    this.setState({
      wizardVisibility: isVisible,
      sourceInWizard: source,
      jumpStep,
      showNewKapacitor,
    })
  }

  private handleSetActiveKapacitor = kapacitor => {
    this.props.setActiveKapacitor(kapacitor)
  }
}

const mstp = ({sources}) => ({
  sources,
})

const mdtp = {
  notify: notifyAction,
  removeAndLoadSources: sourcesActions.removeAndLoadSources,
  fetchKapacitors: sourcesActions.fetchKapacitorsAsync,
  setActiveKapacitor: sourcesActions.setActiveKapacitorAsync,
  deleteKapacitor: sourcesActions.deleteKapacitorAsync,
}

export default connect(mstp, mdtp)(ManageSources)
