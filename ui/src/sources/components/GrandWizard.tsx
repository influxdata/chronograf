import React, {PureComponent} from 'react'
import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

interface Props {
  wizardVisibility: boolean
  toggleVisibility: (isVisible: boolean) => () => void
}

interface State {
  completion: object
}

class GrandWizard extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      completion: {
        first: false,
        second: false,
        third: false,
      },
    }
  }
  public render() {
    const {wizardVisibility, toggleVisibility} = this.props
    return (
      <WizardOverlay
        visible={wizardVisibility}
        toggleVisibility={toggleVisibility}
        title="Grand Wizard"
        skipLinkText="configure later"
      >
        <WizardStep
          title="First Step"
          tipText="One is the lonliest number that you ever knew..."
          isComplete={this.completeTest('first')}
          onNext={this.handleFirstNext}
          onPrevious={this.handleFirstPrev}
        >
          some first children
        </WizardStep>
        <WizardStep
          title="Second Step"
          tipText="It takes two to tango."
          isComplete={this.completeTest('second')}
          onNext={this.handleSecondNext}
          onPrevious={this.handleSecondPrev}
          nextLabel="Go On!"
          previousLabel="Now hold on a sec..."
        >
          some second children
        </WizardStep>
        <WizardStep
          title="Third Step"
          tipText="Three's a crowd... or drama..."
          isComplete={this.completeTest('third')}
          onNext={this.handleThirdNext}
          onPrevious={this.handleThirdPrev}
        >
          some third children
        </WizardStep>
      </WizardOverlay>
    )
  }

  private completeTest = curr => () => {
    const {completion} = this.state
    return completion[curr]
  }

  private handleFirstNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, first: true},
    })
  }

  private handleSecondNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, second: true},
    })
  }

  private handleThirdNext = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, third: true},
    })
  }

  private handleFirstPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, first: false},
    })
  }

  private handleSecondPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, second: false},
    })
  }

  private handleThirdPrev = () => {
    const {completion} = this.state
    this.setState({
      completion: {...completion, third: false},
    })
  }
}

export default GrandWizard
