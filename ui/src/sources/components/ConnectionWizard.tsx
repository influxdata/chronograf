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
import CompletionStep from 'src/sources/components/CompletionStep'

// Types
import {Kapacitor, Source} from 'src/types'
import {ToggleVisibility} from 'src/types/wizard'

interface Props {
  isVisible: boolean
  toggleVisibility: ToggleVisibility
  source: Source
  jumpStep: number
}

interface State {
  source: Source
  kapacitor: Kapacitor
}

@ErrorHandling
class ConnectionWizard extends PureComponent<Props & WithRouterProps, State> {
  public static getDerivedStateFromProps(props: Props) {
    const {source} = props
    return {source}
  }
  public sourceStepRef: any
  public kapacitorStepRef: any
  public completionStepRef: any

  constructor(props: Props & WithRouterProps) {
    super(props)
    this.state = {
      source: null,
      kapacitor: null,
    }
  }

  public render() {
    const {isVisible, toggleVisibility, jumpStep} = this.props
    const {source} = this.state
    return (
      <WizardOverlay
        visible={isVisible}
        toggleVisibility={toggleVisibility}
        resetWizardState={this.resetWizardState}
        title="Add Connection"
        skipLinkText="dismiss"
        maxWidth={800}
        jumpStep={jumpStep}
      >
        <WizardStep
          title="Add a New InfluxDB Connection"
          tipText=""
          isComplete={this.isSourceComplete}
          onNext={this.handleSourceNext}
          nextLabel={source ? 'Update Connection' : 'Add Connection'}
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
          title="You are complete"
          tipText="yay"
          isComplete={this.isCompletionComplete}
          onNext={this.handleCompletionNext}
          onPrevious={this.handleCompletionPrev}
          nextLabel="Dismiss"
          previousLabel="Go Back"
        >
          <CompletionStep
            ref={c => (this.completionStepRef = c && c.getWrappedInstance())}
          />
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
