import React, {PureComponent} from 'react'
import WizardOverlay from 'src/reusable_ui/components/wizard/WizardOverlay'
import WizardStep from 'src/reusable_ui/components/wizard/WizardStep'

// import {} from 'src/types'

interface Props {
  wizardVisibility: boolean
}

class WizardWithSteps extends PureComponent<Props> {
  public render() {
    const {wizardVisibility} = this.props

    return (
      <WizardOverlay visible={wizardVisibility} title="Grand Wizard">
        <WizardStep title="First Real Step">some first children</WizardStep>
        <WizardStep title="Second Real Step">some second children</WizardStep>
        <WizardStep title="Third Real Step">some third children</WizardStep>
      </WizardOverlay>
    )
  }
}

export default WizardWithSteps
