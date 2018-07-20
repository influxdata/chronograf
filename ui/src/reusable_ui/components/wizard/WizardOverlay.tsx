import React, {PureComponent, ReactElement} from 'react'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'

import {WizardStepProps} from 'src/types/wizard'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  visible: boolean
  title: string
  toggleVisibility: (isVisible: boolean) => () => void
  skipLinkText?: string
}

class WizardOverlay extends PureComponent<Props> {
  public render() {
    const {
      children,
      visible,
      title,
      toggleVisibility,
      skipLinkText,
    } = this.props

    return (
      <OverlayTechnology visible={visible}>
        <OverlayContainer maxWidth={800}>
          <OverlayHeading title={title} />
          <OverlayBody>
            <WizardCloak
              skipLinkText={skipLinkText}
              toggleVisibility={toggleVisibility}
            >
              {children}
            </WizardCloak>
          </OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }
}

export default WizardOverlay
