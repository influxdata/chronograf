import React, {PureComponent, ReactElement} from 'react'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'

import {WizardStepProps} from 'src/types/wizard'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  visible: boolean
  title: string
  toggleVisibility: (isVisible: boolean) => () => void
  skipLinkText?: string
  maxWidth?: number
}

@ErrorHandling
class WizardOverlay extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    maxWidth: 800,
  }

  public render() {
    const {visible, title, maxWidth} = this.props

    return (
      <OverlayTechnology visible={visible}>
        <OverlayContainer maxWidth={maxWidth}>
          <OverlayHeading title={title} />
          <OverlayBody>{this.wizardCloak}</OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }

  private get wizardCloak() {
    const {children, skipLinkText, toggleVisibility} = this.props

    if (children) {
      return (
        <WizardCloak
          skipLinkText={skipLinkText}
          handleSkip={toggleVisibility(false)}
        >
          {children}
        </WizardCloak>
      )
    }

    return null
  }
}

export default WizardOverlay
