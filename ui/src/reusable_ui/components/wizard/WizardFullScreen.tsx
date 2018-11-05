// Libraries
import React, {PureComponent, ReactElement} from 'react'

// Components
import WizardController from 'src/reusable_ui/components/wizard/WizardController'

import {WizardStepProps} from 'src/reusable_ui/components/wizard/WizardStep'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  skipLinkText?: string
  handleSkip?: () => void
  switchLinkText?: string
  handleSwitch?: () => void
  isUsingAuth: boolean
  isJumpingAllowed: boolean
}

@ErrorHandling
class WizardFullScreen extends PureComponent<Props> {
  public render() {
    return (
      <div className="wizard-splash auth-image">
        <div className="wizard-container">{this.WizardController}</div>
        <p className="auth-credits">
          Powered by <span className="icon cubo-uniform" /> InfluxData
        </p>
      </div>
    )
  }

  private get WizardController() {
    const {
      children,
      skipLinkText,
      handleSkip,
      handleSwitch,
      switchLinkText,
      isUsingAuth,
      isJumpingAllowed,
    } = this.props

    if (children) {
      return (
        <WizardController
          handleSkip={handleSkip}
          skipLinkText={skipLinkText}
          handleSwitch={handleSwitch}
          switchLinkText={switchLinkText}
          isUsingAuth={isUsingAuth}
          jumpStep={0}
          isJumpingAllowed={isJumpingAllowed}
        >
          {children}
        </WizardController>
      )
    }

    return null
  }
}

export default WizardFullScreen
