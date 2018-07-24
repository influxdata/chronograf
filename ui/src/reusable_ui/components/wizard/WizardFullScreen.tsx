import React, {PureComponent, ReactElement} from 'react'

import SplashPage from 'src/shared/components/SplashPage'
import WizardCloak from 'src/reusable_ui/components/wizard/WizardCloak'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {WizardStepProps} from 'src/types/wizard'

import 'src/reusable_ui/components/wizard/WizardFullScreen.scss'
interface Props {
  children: Array<ReactElement<WizardStepProps>>
  title: string
  skipLinkText?: string
  handleSkip: () => void
}

@ErrorHandling
class WizardFullScreen extends PureComponent<Props> {
  public render() {
    const {children, title, skipLinkText, handleSkip} = this.props

    return (
      <SplashPage>
        <>
          <h1 className="wizard-title">{title}</h1>
          <div className="wizard-container">
            <WizardCloak handleSkip={handleSkip} skipLinkText={skipLinkText}>
              {children}
            </WizardCloak>
          </div>
        </>
      </SplashPage>
    )
  }
}

export default WizardFullScreen
