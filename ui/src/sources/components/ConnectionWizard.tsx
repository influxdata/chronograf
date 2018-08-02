// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import SourceStep from 'src/sources/components/SourceStep'
import KapacitorStep from 'src/sources/components/KapacitorStep'
import DashboardsStep from 'src/sources/components/DashboardsStep'
import CompletionStep from 'src/sources/components/CompletionStep'

// Types
import {Kapacitor, Source} from 'src/types'

interface Props {
  isVisible: boolean
  toggleVisibility: (isVisible: boolean) => () => void
}

interface State {
  source: Source
  kapacitor: Kapacitor
}

@ErrorHandling
class ConnectionWizard extends PureComponent<Props, State> {
  public sourceStepRef: any
  public kapacitorStepRef: any
  constructor(props: Props) {
    super(props)
    this.state = {
      source: null,
      kapacitor: null,
    }
  }
  public render() {
    const {isVisible, toggleVisibility} = this.props
    const {source} = this.state
    return (
      <WizardOverlay
        visible={isVisible}
        toggleVisibility={toggleVisibility}
        title="Add Connection"
        skipLinkText="skip this step"
        maxWidth={1200}
      >
        <WizardStep
          title="Add a New InfluxDB Connection"
          tipText=""
          isComplete={this.isSourceComplete}
          onNext={this.handleSourceNext}
          nextLabel="Create Source"
          previousLabel="Cancel"
        >
          <SourceStep
            ref={c => (this.sourceStepRef = c && c.getWrappedInstance())}
            source={source}
          />
        </WizardStep>
        <WizardStep
          title="Add a Kapacitor Connection"
          tipText="this step is optional"
          isComplete={this.isKapacitorComplete}
          onNext={this.handleKapacitorNext}
          onPrevious={this.handleKapacitorPrev}
          nextLabel="Continue"
          previousLabel="Go Back"
        >
          <KapacitorStep
            ref={c => (this.kapacitorStepRef = c && c.getWrappedInstance())}
            source={source}
          />
        </WizardStep>
        <WizardStep
          title="Select Preset Dashboards"
          tipText="this step is optional"
          isComplete={this.isDashboardComplete}
          onNext={this.handleDashboardNext}
          onPrevious={this.handleDashboardPrev}
          nextLabel="Complete Connection"
          previousLabel="Go Back"
        >
          something something
        </WizardStep>
        <WizardStep
          title="You are complete"
          isComplete={this.isDashboardComplete}
          tipText="yay"
          nextLabel="Dismiss"
          previousLabel="Go Back"
        >
          yay!
        </WizardStep>
      </WizardOverlay>
    )
  }

  private handleSourceNext = async () => {
    const source = await this.sourceStepRef.next()
    this.setState({source})
  }

  private isSourceComplete = () => {
    const {source} = this.state
    return !_.isNull(source)
  }

  private isKapacitorComplete = () => {
    const {kapacitor} = this.state
    return !_.isNull(kapacitor)
  }

  private handleKapacitorNext = async () => {
    const kapacitor = await this.kapacitorStepRef.next()
    this.setState({kapacitor})
  }

  private handleKapacitorPrev = () => {}

  private isDashboardComplete = () => {
    return false
  }

  private handleDashboardNext = () => {}

  private handleDashboardPrev = () => {}
}

export default ConnectionWizard
