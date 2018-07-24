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
  handleSkip?: () => void
}

@ErrorHandling
class WizardFullScreen extends PureComponent<Props> {
  public render() {
    const {title} = this.props

    return (
      <SplashPage>
        <>
          <h1 className="wizard-title">{title}</h1>
          <div className="wizard-container">{this.wizardCloak}</div>
        </>
      </SplashPage>
    )
  }

  private get wizardCloak() {
    const {children, skipLinkText, handleSkip} = this.props

    if (children) {
      return (
        <WizardCloak handleSkip={handleSkip} skipLinkText={skipLinkText}>
          {children}
        </WizardCloak>
      )
    }

    return null
  }
}

export default WizardFullScreen
