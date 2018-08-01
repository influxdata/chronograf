import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'
import SourceStep from 'src/sources/components/SourceStep'

interface Props {
  isVisible: boolean
  toggleVisibility: (isVisible: boolean) => () => void
}

interface State {
  completion: object
}

@ErrorHandling
class ConnectionWizard extends PureComponent<Props, State> {
  public sourceStepRef: any
  constructor(props: Props) {
    super(props)
    this.state = {
      completion: [false, false, false],
    }
  }
  public render() {
    const {isVisible, toggleVisibility} = this.props

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
            setCompletion={this.setCompletion(0)}
          />
        </WizardStep>
        <WizardStep
          title="Add a Kapacitor Connection"
          tipText="this step is optional"
          isComplete={this.isKapacitorComplete}
          onNext={this.handleSecondNext}
          onPrevious={this.handleSecondPrev}
          nextLabel="Continue"
          previousLabel="Go Back"
        >
          some second children
        </WizardStep>
        <WizardStep
          title="Select Preset Dashboards"
          tipText="this step is optional"
          isComplete={this.isDashboardSelectionComplete}
          onNext={this.handleThirdNext}
          onPrevious={this.handleThirdPrev}
          nextLabel="Complete Connection"
          previousLabel="Go Back"
        >
          Dashboards boxes here
        </WizardStep>
      </WizardOverlay>
    )
  }

  private setCompletion = index => isComplete => {
    const {completion} = this.state
    completion[index] = isComplete
    this.setState({completion})
  }

  private handleSourceNext = () => {
    this.sourceStepRef.next()
  }

  private isSourceComplete = () => {
    const {completion} = this.state
    return completion[0]
  }

  private isKapacitorComplete = () => {
    const {completion} = this.state
    return completion[1]
  }

  private isDashboardSelectionComplete = () => {
    const {completion} = this.state
    return completion[2]
  }

  private handleSecondNext = () => {
    const {completion} = this.state
    completion[1] = true
    this.setState({
      completion,
    })
  }
  private handleThirdNext = () => {
    const {completion} = this.state
    completion[2] = true
    this.setState({
      completion,
    })
  }

  private handleSecondPrev = () => {
    const {completion} = this.state
    completion[1] = false
    this.setState({
      completion,
    })
  }
  private handleThirdPrev = () => {
    const {completion} = this.state
    completion[2] = false
    this.setState({
      completion,
    })
  }
}

export default ConnectionWizard
