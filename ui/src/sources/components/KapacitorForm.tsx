// Libraries
import React, {PureComponent} from 'react'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'

// Utils
import {getDeep} from 'src/utils/wrappers'

// Constants
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'

// Types
import {Kapacitor} from 'src/types'

interface Props {
  kapacitor: Kapacitor
  onChangeInput: (key: string) => (value: string | boolean) => void
}

@ErrorHandling
class KapacitorForm extends PureComponent<Props> {
  public render() {
    const {kapacitor, onChangeInput} = this.props
    return (
      <>
        <WizardTextInput
          value={kapacitor.url}
          label="Kapacitor URL"
          onChange={onChangeInput('url')}
          valueModifier={this.URLModifier}
        />
        <WizardTextInput
          value={kapacitor.name}
          label="Name"
          onChange={onChangeInput('name')}
        />
        <WizardTextInput
          value={kapacitor.username}
          label="Username"
          onChange={onChangeInput('username')}
        />
        <WizardTextInput
          value={kapacitor.password}
          label="Password"
          type="password"
          onChange={onChangeInput('password')}
        />
        {this.isHTTPS && (
          <WizardCheckbox
            isChecked={kapacitor.insecureSkipVerify}
            text={`Unsafe SSL`}
            onChange={onChangeInput('insecureSkipVerify')}
            subtext={insecureSkipVerifyText}
          />
        )}
      </>
    )
  }

  private get isHTTPS(): boolean {
    const {kapacitor} = this.props
    return getDeep<string>(kapacitor, 'url', '').startsWith('https')
  }

  private URLModifier = (value: string): string => {
    const url = value.trim()
    if (url.startsWith('http')) {
      return url
    }
    return `http://${url}`
  }
}

export default KapacitorForm
