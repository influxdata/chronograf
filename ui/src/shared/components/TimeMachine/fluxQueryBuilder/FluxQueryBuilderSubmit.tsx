// Libraries
import React, {useMemo, useRef, useState} from 'react'
import {
  Button,
  ComponentColor,
  ComponentSize,
  ComponentStatus,
} from 'src/reusable_ui'
import {fluxWizardError} from 'src/shared/copy/notifications'
import {PublishNotificationActionCreator} from 'src/types/actions/notifications'
import {ClickOutside} from '../../ClickOutside'
import {QueryBuilderState} from './types'
import {buildQuery} from './util/generateFlux'

interface Props {
  isRunnable: boolean
  onSubmit: (s: string) => void
  editorScript: string
  builderState: QueryBuilderState
  notify: PublishNotificationActionCreator
}
const EMPTY_FN = () => {}

const FluxQueryBuilderSubmit = ({
  builderState,
  isRunnable,
  editorScript,
  onSubmit,
  notify,
}: Props) => {
  if (!isRunnable) {
    return (
      <Button
        size={ComponentSize.ExtraSmall}
        color={ComponentColor.Primary}
        onClick={EMPTY_FN}
        status={ComponentStatus.Disabled}
        text="Submit"
        customClass="fqb--submit"
      />
    )
  }

  const [showConfirm, setShowConfirm] = useState(false)
  const buttonRef = useRef<HTMLDivElement>()
  const lastConfirmedBuilderState = useMemo(() => {
    return builderState
  }, [editorScript])

  return (
    <div ref={buttonRef}>
      {!showConfirm ? (
        <Button
          size={ComponentSize.ExtraSmall}
          color={ComponentColor.Primary}
          onClick={() => {
            try {
              const script = buildQuery(builderState)
              const lastScript = buildQuery(lastConfirmedBuilderState)
              // submit directly if editor is empty, the generated query is the same as the editor query
              // or if the builder was used to generate the new script
              if (
                !editorScript ||
                script === editorScript ||
                editorScript === lastScript
              ) {
                onSubmit(script)
              } else {
                setShowConfirm(true)
              }
            } catch (ex) {
              console.error(ex)
              notify(
                fluxWizardError('Unable to build flux script: ' + ex.message)
              )
            }
          }}
          status={ComponentStatus.Default}
          text="Submit"
          customClass="fqb--submit"
        />
      ) : (
        <>
          <Button
            size={ComponentSize.ExtraSmall}
            color={ComponentColor.Primary}
            onClick={EMPTY_FN}
            status={
              isRunnable ? ComponentStatus.Default : ComponentStatus.Disabled
            }
            text="Submit"
            customClass="fqb--submit"
          />
          <div
            className="fqb--confirm-popup"
            style={{
              left: `${
                buttonRef.current.getBoundingClientRect().right - 350
              }px`,
            }}
          >
            <span>
              Submitting the Script Builder will overwrite the existing Flux
              script, any changes you have made using Flux will be discarded.
              This cannot be recovered.
            </span>
            <ClickOutside onClickOutside={() => setShowConfirm(false)}>
              <Button
                size={ComponentSize.ExtraSmall}
                color={ComponentColor.Danger}
                onClick={() => {
                  try {
                    const script = buildQuery(builderState)
                    setShowConfirm(false)
                    onSubmit(script)
                  } catch (ex) {
                    console.error(ex)
                    notify(
                      fluxWizardError(
                        'Unable to build flux script: ' + ex.message
                      )
                    )
                  }
                }}
                status={ComponentStatus.Default}
                text="OK"
              />
            </ClickOutside>
          </div>
        </>
      )}
    </div>
  )
}

export default FluxQueryBuilderSubmit
