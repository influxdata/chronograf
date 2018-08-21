// Libraries
import React, {PureComponent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import SourceStep from 'src/sources/components/SourceStep'
import KapacitorStep from 'src/sources/components/KapacitorStep'
import DashboardStep from 'src/sources/components/DashboardStep'
import CompletionStep from 'src/sources/components/CompletionStep'

// Types
import {Kapacitor, Source, Protoboard} from 'src/types'
import {ToggleWizard} from 'src/types/wizard'

interface Props {
  isVisible: boolean
  toggleVisibility: ToggleWizard
  source: Source
  jumpStep: number
  showNewKapacitor?: boolean
}

interface State {
  source: Source
  sourceError: boolean
  kapacitor: Kapacitor
  kapacitorError: boolean
  dashboardError: boolean
  dashboards: Protoboard[]
}

@ErrorHandling
class ConnectionWizard extends PureComponent<Props & WithRouterProps, State> {
  public static getDerivedStateFromProps(props: Props, state: State) {
    const sourceInState = state.source
    const sourceInProps = props.source
    if (_.isNull(sourceInState) && !_.isNull(sourceInProps)) {
      return {source: sourceInProps}
    }
    return null
  }
  public sourceStepRef: any
  public kapacitorStepRef: any
  public completionStepRef: any
  public dashboardStepRef: any

  constructor(props: Props & WithRouterProps) {
    super(props)
    this.state = {
      source: null,
      kapacitor: null,
      sourceError: false,
      kapacitorError: false,
      dashboardError: false,
      dashboards: null,
    }
  }

  public render() {
    const {isVisible, toggleVisibility, jumpStep, showNewKapacitor} = this.props
    const {
      source,
      sourceError,
      kapacitor,
      kapacitorError,
      dashboardError,
    } = this.state

    return (
      <WizardOverlay
        visible={isVisible}
        toggleVisibility={toggleVisibility}
        resetWizardState={this.resetWizardState}
        title="Connection Configuration"
        skipLinkText="dismiss"
        maxWidth={800}
        jumpStep={jumpStep}
      >
        <WizardStep
          title="InfluxDB Connection"
          tipText=""
          isComplete={this.isSourceComplete}
          isErrored={sourceError}
          isBlockingStep={true}
          onNext={this.handleSourceNext}
          nextLabel={source ? 'Update Connection' : 'Add Connection'}
          previousLabel="Cancel"
        >
          <SourceStep
            ref={c => (this.sourceStepRef = c && c.getWrappedInstance())}
            setError={this.handleSetSourceError}
            source={source}
          />
        </WizardStep>
        <WizardStep
          title="Kapacitor Connection"
          tipText=""
          isComplete={this.isKapacitorComplete}
          isErrored={kapacitorError}
          isBlockingStep={true}
          onNext={this.handleKapacitorNext}
          onPrevious={this.handleKapacitorPrev}
          nextLabel="Continue"
          previousLabel="Go Back"
        >
          <KapacitorStep
            ref={c => (this.kapacitorStepRef = c && c.getWrappedInstance())}
            setError={this.handleSetKapacitorError}
            source={source}
            kapacitor={kapacitor}
            showNewKapacitor={showNewKapacitor}
          />
        </WizardStep>
        <WizardStep
          title="Select Dashboards"
          isComplete={this.isDashboardComplete}
          isErrored={dashboardError}
        >
          {this.dashboardStep}
        </WizardStep>
        <WizardStep
          title="Setup Complete"
          tipText=""
          isComplete={this.isCompletionComplete}
          isErrored={false}
          onNext={this.handleCompletionNext}
          onPrevious={this.handleCompletionPrev}
          nextLabel="View All Connections"
          previousLabel="Go Back"
        >
          <CompletionStep
            ref={c => (this.completionStepRef = c && c.getWrappedInstance())}
          />
        </WizardStep>
      </WizardOverlay>
    )
  }

  private get dashboardStep() {
    const {dashboards} = this.state

    if (dashboards) {
      return <DashboardStep dashboards={dashboards} />
    }

    return null
  }

  private handleSourceNext = async () => {
    const response = await this.sourceStepRef.next()
    this.setState({source: response.payload})
    return response
  }
  private isSourceComplete = () => {
    const {source} = this.state
    return !_.isNull(source)
  }
  private handleSetSourceError = (b: boolean) => {
    this.setState({sourceError: b})
  }

  private isKapacitorComplete = () => {
    const {kapacitor} = this.state
    return !_.isNull(kapacitor)
  }
  private handleKapacitorNext = async () => {
    const response = await this.kapacitorStepRef.next()
    this.setState({kapacitor: response.payload})
    return response
  }
  private handleKapacitorPrev = () => {}
  private handleSetKapacitorError = (b: boolean) => {
    this.setState({kapacitorError: b})
  }

  private isDashboardComplete = () => {
    return false
  }

  private isCompletionComplete = () => {
    return false
  }
  private handleCompletionNext = () => {
    const {router} = this.props
    const {source} = this.state
    this.resetWizardState()
    if (source) {
      router.push(`/sources/${source.id}/manage-sources`)
    }
    return {success: true, payload: null}
  }
  private handleCompletionPrev = () => {}

  private resetWizardState = () => {
    this.setState({
      source: null,
      kapacitor: null,
    })
  }
}

export default withRouter(ConnectionWizard)
