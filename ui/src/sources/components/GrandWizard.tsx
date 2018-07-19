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
        first: true,
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
      >
        <WizardStep
          title="First Real Step"
          isComplete={this.completeTest('first')}
          onNext={this.handleFirstNext}
          onPrevious={this.handleFirstPrev}
        >
          some first children
        </WizardStep>
        <WizardStep
          title="Second Real Step"
          isComplete={this.completeTest('second')}
          onNext={this.handleSecondNext}
          onPrevious={this.handleSecondPrev}
        >
          some second children
        </WizardStep>
        <WizardStep
          title="Third Real Step"
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
