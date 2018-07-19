import React, {PureComponent, ReactElement, ReactNode} from 'react'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'
interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious: () => void
  onNext: () => void
  increment?: () => void
  decrement?: () => void
}
// import {} from 'src/types'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  visible: boolean
  title: string
  toggleVisibility: (isVisible: boolean) => () => void
}

class WizardOverlay extends PureComponent<Props> {
  public render() {
    const {children, visible, title, toggleVisibility} = this.props

    return (
      <OverlayTechnology visible={visible}>
        <OverlayContainer>
          <OverlayHeading title={title} />
          <OverlayBody>
            <WizardCloak toggleVisibility={toggleVisibility}>
              {children}
            </WizardCloak>
          </OverlayBody>
        </OverlayContainer>
      </OverlayTechnology>
    )
  }
}

export default WizardOverlay
