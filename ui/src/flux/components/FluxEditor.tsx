// Libraries
import React, {PureComponent} from 'react'

// Components
import FluxScriptEditor from 'src/flux/components/FluxScriptEditor'
import {Button, ComponentSize, ComponentColor} from 'src/reusable_ui'

// Types
import {Suggestion, ScriptStatus} from 'src/types/flux'

interface Props {
  status: ScriptStatus
  script: string
  visibility: string
  suggestions: Suggestion[]
  onChangeScript: (draftScript: string) => void
  onSubmitScript: () => void
  onShowWizard: () => void
}

class FluxEditor extends PureComponent<Props> {
  public render() {
    const {
      status,
      script,
      visibility,
      suggestions,
      onChangeScript,
      onSubmitScript,
      onShowWizard,
    } = this.props

    return (
      <div className="flux-editor">
        <FluxScriptEditor
          status={status}
          script={script}
          visibility={visibility}
          suggestions={suggestions}
          onChangeScript={onChangeScript}
          onSubmitScript={onSubmitScript}
        >
          {script.trim() === '' && (
            <div className="flux-script-wizard--bg-hint">
              <p>
                New to Flux? Give the{' '}
                <Button
                  text={'Script Wizard'}
                  color={ComponentColor.Primary}
                  titleText={'Open Script Wizard'}
                  size={ComponentSize.Large}
                  onClick={onShowWizard}
                />{' '}
                a try
              </p>
            </div>
          )}
        </FluxScriptEditor>
      </div>
    )
  }
}

export default FluxEditor
