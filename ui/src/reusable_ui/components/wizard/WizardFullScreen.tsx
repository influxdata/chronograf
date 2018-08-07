// Libraries
import React, {PureComponent, ReactElement} from 'react'

// Components
import SplashPage from 'src/shared/components/SplashPage'
import WizardController from 'src/reusable_ui/components/wizard/WizardController'

// Types
import {WizardStepProps} from 'src/types/wizard'

import {ErrorHandling} from 'src/shared/decorators/errors'

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
          <div className="wizard-container">{this.WizardController}</div>
        </>
      </SplashPage>
    )
  }

  private get WizardController() {
    const {children, skipLinkText, handleSkip} = this.props

    if (children) {
      return (
        <WizardController handleSkip={handleSkip} skipLinkText={skipLinkText}>
          {children}
        </WizardController>
      )
    }

    return null
  }
}

export default WizardFullScreen
