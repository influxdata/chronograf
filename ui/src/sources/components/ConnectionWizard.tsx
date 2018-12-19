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
import {ToggleWizard, NextReturn} from 'src/types/wizard'

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
  dashboardsCreated: Protoboard[]
  hasNextOnDashboard: boolean
  selectedDashboards: number
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
      dashboardsCreated: [],
      hasNextOnDashboard: false,
      selectedDashboards: 0,
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
      dashboardsCreated,
    } = this.state
    return (
      <WizardOverlay
        visible={isVisible}
        toggleVisibility={toggleVisibility}
        resetWizardState={this.resetWizardState}
        title="Connection Configuration"
        maxWidth={800}
        jumpStep={jumpStep}
        isJumpingAllowed={this.isSourceComplete()}
      >
        <WizardStep
          title="InfluxDB Connection"
          tipText=""
          isComplete={this.isSourceComplete}
          isErrored={sourceError}
          isSkippableStep={false}
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
          title="Dashboards"
          tipText="Select Dashboards you would like to create:"
          isComplete={this.isDashboardComplete}
          isSkippableStep={false}
          isErrored={dashboardError}
          nextLabel={this.dashboardNextLabel}
          onNext={this.handleDashboardNext}
          previousLabel="Go Back"
        >
          <DashboardStep
            ref={c => (this.dashboardStepRef = c && c.getWrappedInstance())}
            source={source}
            dashboardsCreated={dashboardsCreated}
            countSelected={this.countSelected}
          />
        </WizardStep>
        <WizardStep
          title="Kapacitor Connection"
          tipText=""
          isComplete={this.isKapacitorComplete}
          isSkippableStep={true}
          isErrored={kapacitorError}
          onNext={this.handleKapacitorNext}
          onPrevious={this.handleKapacitorPrev}
          nextLabel="Continue"
          previousLabel="Go Back"
        >
          <KapacitorStep
            ref={c => (this.kapacitorStepRef = c && c.getWrappedInstance())}
            source={source}
            setError={this.handleSetKapacitorError}
            kapacitor={kapacitor}
            showNewKapacitor={showNewKapacitor}
            setKapacitorDraft={this.setKapacitorDraft}
          />
        </WizardStep>
        <WizardStep
          title="Setup Complete"
          tipText=""
          isComplete={this.isCompletionComplete}
          isSkippableStep={false}
          isErrored={false}
          onNext={this.handleCompletionNext}
          onPrevious={this.handleCompletionPrev}
          nextLabel="Finish"
          previousLabel="Go Back"
        >
          <CompletionStep
            ref={c => (this.completionStepRef = c && c.getWrappedInstance())}
          />
        </WizardStep>
      </WizardOverlay>
    )
  }
  private get isSourceEdited() {
    return !_.isEqual(this.state.source, this.props.source)
  }

  // SourceStep
  private isSourceComplete = () => {
    const {source} = this.state
    return !_.isNull(source)
  }

  private handleSourceNext = async () => {
    const response: NextReturn = await this.sourceStepRef.next()
    this.setState({source: response.payload, sourceError: response.error})
    return response
  }

  private handleSetSourceError = (b: boolean) => {
    if (this.state.sourceError !== b) {
      this.setState({sourceError: b})
    }
  }

  // DashboardStep
  private isDashboardComplete = () => {
    const {hasNextOnDashboard} = this.state
    return hasNextOnDashboard
  }

  private handleDashboardNext = async () => {
    const response: NextReturn = await this.dashboardStepRef.next()
    this.setState({
      dashboardError: response.error,
      dashboardsCreated: response.payload,
      hasNextOnDashboard: true,
    })
    return response
  }

  private countSelected = (selectedDashboards: number) => {
    this.setState({selectedDashboards})
  }

  private get dashboardNextLabel(): string {
    const {selectedDashboards} = this.state

    if (selectedDashboards) {
      return `Create ${selectedDashboards} Dashboard${
        selectedDashboards > 1 ? 's' : ''
      }`
    }

    return 'Next'
  }

  // KapacitorStep
  private isKapacitorComplete = () => {
    const {kapacitor} = this.state
    return !_.isNull(kapacitor)
  }

  private handleKapacitorNext = async () => {
    const response: NextReturn = await this.kapacitorStepRef.next()
    this.setState({
      kapacitor: response.payload,
      kapacitorError: response.error,
    })
    return response
  }

  private setKapacitorDraft = (kapacitor: Kapacitor) => {
    this.setState({kapacitor})
  }

  private handleKapacitorPrev = () => {}

  private handleSetKapacitorError = (b: boolean) => {
    if (this.state.kapacitorError !== b) {
      this.setState({kapacitorError: b})
    }
  }

  // CompletionStep
  private isCompletionComplete = () => {
    return false
  }

  private handleCompletionNext = (): NextReturn => {
    const {router} = this.props
    const {source} = this.state
    this.resetWizardState()
    if (this.isSourceEdited) {
      router.push(`/sources/${source.id}/manage-sources`)
    }
    return {error: false, payload: null}
  }

  private handleCompletionPrev = () => {}

  private resetWizardState = () => {
    this.setState({
      source: null,
      kapacitor: null,
      sourceError: false,
      kapacitorError: false,
      dashboardError: false,
      dashboardsCreated: [],
      hasNextOnDashboard: false,
    })
  }
}

export default withRouter(ConnectionWizard)
