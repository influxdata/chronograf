import React, {PureComponent, ReactNode} from 'react'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'

// import {} from 'src/types'

interface Props {
  children: ReactNode
  visible: boolean
  title: string
}

class WizardOverlay extends PureComponent<Props> {
  public render() {
    const {children, visible, title} = this.props

    return (
      <OverlayTechnology visible={visible}>
        <OverlayContainer>
          <OverlayHeading title={title} />
          <OverlayBody>
            <WizardCloak>{children}</WizardCloak>
          </OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }
}

export default WizardOverlay
