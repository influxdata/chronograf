// Libraries
import {useEffect, useState} from 'react'
import {get} from 'lodash'

// Types
import {TypingStatus, ValidationState} from 'src/types'

// Helpers
import isValidMessage from 'src/kapacitor/utils/alertMessageValidation'

// APIs
import {validateTextTemplate} from 'src/shared/apis/validate_templates'

// Copy
const messageValid = 'Alert message is syntactically correct.'
const messageInvalid = 'Please correct templates in alert message.'
const messageValidating = 'Validating template'

export const useMessageValidation = (
  typingStatus: TypingStatus,
  ruleMessage: string
) => {
  // text is the validation text to display to the user
  const [text, setValidationText] = useState('')
  // state is the current state of go template parsing
  const [state, setValidationState] = useState(ValidationState.NotStarted)

  useEffect(
    () => {
      const validate = async () => {
        if (typingStatus === TypingStatus.Started) {
          setValidationState(ValidationState.Validating)
          setValidationText(messageValidating)
        }

        if (typingStatus === TypingStatus.Done) {
          try {
            await validateTextTemplate(
              '/chronograf/v1/validate_text_templates',
              ruleMessage
            )

            const matchesVars = isValidMessage(ruleMessage)

            if (matchesVars) {
              setValidationText(messageValid)
              setValidationState(ValidationState.Success)
            } else {
              setValidationText(messageInvalid)
              setValidationState(ValidationState.Error)
            }
          } catch (error) {
            const errorMessage = get(error, 'data.message', messageInvalid)
            setValidationText(errorMessage)
            setValidationState(ValidationState.Error)
          }
        }
      }

      validate()
    },
    [typingStatus]
  )

  return {text, state}
}
