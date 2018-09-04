import React, {PureComponent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import {connect} from 'react-redux'
import _ from 'lodash'

import WizardFullScreen from 'src/reusable_ui/components/wizard/WizardFullScreen'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import SourceStep from 'src/sources/components/SourceStep'
import KapacitorStep from 'src/sources/components/KapacitorStep'
import CompletionStep from 'src/sources/components/CompletionStep'
import Notifications from 'src/shared/components/Notifications'
import DashboardStep from 'src/sources/components/DashboardStep'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {Kapacitor, Source, Me, Protoboard} from 'src/types'
import {NextReturn} from 'src/types/wizard'

interface Props extends WithRouterProps {
  me: Me
  isUsingAuth: boolean
}

interface State {
  source: Partial<Source>
  sourceError: boolean
  kapacitor: Kapacitor
  kapacitorError: boolean
  dashboardError: boolean
  dashboardsCreated: Protoboard[]
  hasNextOnDashboard: boolean
}

@ErrorHandling
class OnboardingWizard extends PureComponent<Props, State> {
  public sourceStepRef: any
  public kapacitorStepRef: any
  public completionStepRef: any
  public dashboardStepRef: any

  constructor(props) {
    super(props)

    this.state = {
      source: null,
      sourceError: false,
      kapacitor: null,
      kapacitorError: false,
      dashboardError: false,
      dashboardsCreated: [],
      hasNextOnDashboard: false,
    }
  }

  public render() {
    const {
      source,
      sourceError,
      kapacitorError,
      dashboardError,
      dashboardsCreated,
    } = this.state
    const {me, isUsingAuth} = this.props
    return (
      <>
        <Notifications />
        <WizardFullScreen
          title={'Welcome to Influx'}
          skipLinkText={'Switch Organizations'}
          handleSkip={isUsingAuth ? this.gotoPurgatory : null}
        >
          <WizardStep
            title="Add an InfluxDB Connection"
            tipText=""
            isComplete={this.isSourceComplete}
            isErrored={sourceError}
            isBlockingStep={true}
            onNext={this.handleSourceNext}
            nextLabel={source ? 'Update Connection' : 'Add Connection'}
            previousLabel="Cancel"
            onPrevious={this.handleKapacitorPrev}
          >
            <SourceStep
              ref={c => (this.sourceStepRef = c && c.getWrappedInstance())}
              setError={this.handleSetSourceError}
              source={source}
              onBoarding={true}
              me={me}
              isUsingAuth={isUsingAuth}
            />
          </WizardStep>
          <WizardStep
            title="Dashboards"
            tipText="Select dashboards you would like to create:"
            isComplete={this.isDashboardComplete}
            isErrored={dashboardError}
            onNext={this.handleDashboardNext}
          >
            <DashboardStep
              ref={c => (this.dashboardStepRef = c && c.getWrappedInstance())}
              dashboardsCreated={dashboardsCreated}
              source={source}
            />
          </WizardStep>
          <WizardStep
            title="Add a Kapacitor Connection"
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
              onBoarding={true}
            />
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
        </WizardFullScreen>
      </>
    )
  }

  // SourceStep
  private isSourceComplete = () => {
    const {source} = this.state
    return !_.isNull(source)
  }

  private handleSourceNext = async () => {
    const response = await this.sourceStepRef.next()
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

  // KapacitorStep
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
    if (this.state.kapacitorError !== b) {
      this.setState({kapacitorError: b})
    }
  }

  // CompletionStep
  private isCompletionComplete = () => {
    return false
  }

  private handleCompletionNext = () => {
    const {router} = this.props
    const {source} = this.state
    this.resetWizardState()
    if (source) {
      router.push(`/sources/${source.id}/manage-sources`)
    } else {
      router.push(`/`)
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

  private gotoPurgatory = (): void => {
    const {router} = this.props
    router.push('/purgatory')
  }
}

const mstp = ({auth: {isUsingAuth, me}}) => ({isUsingAuth, me})

export default connect(mstp, null)(withRouter(OnboardingWizard))
