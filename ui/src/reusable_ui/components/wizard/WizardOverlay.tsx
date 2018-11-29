// Libraries
import React, {PureComponent, ReactElement} from 'react'

// Components
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import WizardController from 'src/reusable_ui/components/wizard/WizardController'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'

import {WizardStepProps} from 'src/reusable_ui/components/wizard/WizardStep'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {ToggleWizard} from 'src/types/wizard'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  visible: boolean
  title: string
  toggleVisibility: ToggleWizard
  resetWizardState: () => void
  skipLinkText?: string
  maxWidth?: number
  jumpStep: number
  isJumpingAllowed: boolean
}

@ErrorHandling
class WizardOverlay extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    maxWidth: 800,
  }

  public render() {
    const {visible, title, maxWidth} = this.props

    return (
      <div className="wizard-overlay">
        <OverlayTechnology visible={visible}>
          <OverlayContainer maxWidth={maxWidth}>
            <OverlayHeading title={title} onDismiss={this.handleFinish} />
            <OverlayBody>{this.WizardController}</OverlayBody>
          </OverlayContainer>
        </OverlayTechnology>
      </div>
    )
  }

  private get WizardController() {
    const {children, skipLinkText, jumpStep, isJumpingAllowed} = this.props
    if (children) {
      return (
        <WizardController
          skipLinkText={skipLinkText}
          handleFinish={this.handleFinish}
          jumpStep={jumpStep}
          isJumpingAllowed={isJumpingAllowed}
        >
          {children}
        </WizardController>
      )
    }

    return null
  }

  private handleFinish = () => {
    const {toggleVisibility, resetWizardState} = this.props

    toggleVisibility(false)()
    resetWizardState()
  }
}

export default WizardOverlay
