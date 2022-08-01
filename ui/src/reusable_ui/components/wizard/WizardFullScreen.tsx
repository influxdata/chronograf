// Libraries
import React, {PureComponent, ReactElement} from 'react'

// Components
import WizardController from 'src/reusable_ui/components/wizard/WizardController'

import {WizardStepProps} from 'src/reusable_ui/components/wizard/WizardStep'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: Array<ReactElement<WizardStepProps>>
  skipLinkText?: string
  switchLinkText?: string
  handleSwitch?: () => void
  isUsingAuth: boolean
  isJumpingAllowed: boolean
}

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
      handleSwitch,
      switchLinkText,
      isUsingAuth,
      isJumpingAllowed,
    } = this.props

    if (children) {
      return (
        <WizardController
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

export default ErrorHandling(WizardFullScreen)
