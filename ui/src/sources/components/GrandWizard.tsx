import React, {PureComponent} from 'react'
import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

// import {} from 'src/types'

interface Props {
  wizardVisibility: boolean
}

interface State {
  completion: object
}

class WizardWithSteps extends PureComponent<Props, State> {
  constructor(props) {
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
    const {wizardVisibility} = this.props

    return (
      <WizardOverlay visible={wizardVisibility} title="Grand Wizard">
        <WizardStep
          title="First Real Step"
          isComplete={this.completeTest('first')}
        >
          some first children
        </WizardStep>
        <WizardStep
          title="Second Real Step"
          isComplete={this.completeTest('second')}
          onNext={this.handleSecondNext}
        >
          some second children
        </WizardStep>
        <WizardStep
          title="Third Real Step"
          isComplete={this.completeTest('third')}
          onNext={this.handleThirdNext}
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
}

export default WizardWithSteps
