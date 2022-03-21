// Libraries
import React, {useRef, useState} from 'react'
import {
  Button,
  ComponentColor,
  ComponentSize,
  ComponentStatus,
} from 'src/reusable_ui'
import {ClickOutside} from '../../ClickOutside'

interface Props {
  isCustomScript: boolean
  isRunnable: boolean
  submitAction: () => void
}

const FluxQueryBuilderSubmit = ({
  isCustomScript,
  isRunnable,
  submitAction,
}: Props) => {
  const [showConfirm, setShowConfirm] = useState(false)
  const buttonRef = useRef<HTMLDivElement>()
  if (isCustomScript && isRunnable) {
    // TODO require confirmation when isCustomScript
    // Submitting the query builder will discard any changes you have made
    // using Flux. This cannot be recovered.
    return (
      <div ref={buttonRef}>
        <Button
          size={ComponentSize.ExtraSmall}
          color={ComponentColor.Primary}
          onClick={() => setShowConfirm(true)}
          status={
            isRunnable ? ComponentStatus.Default : ComponentStatus.Disabled
          }
          text="Submit"
          customClass="fqb--submit"
        />
        {showConfirm ? (
          <div
            className="fqb--confirm-popup"
            style={{
              left: `${
                buttonRef.current.getBoundingClientRect().right - 350
              }px`,
            }}
          >
            <span>
              Submitting the query builder will overwrite the editor script and
              can thus discard any changes you have made using Flux. This cannot
              be recovered.
            </span>
            <ClickOutside onClickOutside={() => setShowConfirm(false)}>
              <Button
                size={ComponentSize.ExtraSmall}
                color={ComponentColor.Danger}
                onClick={() => {
                  setShowConfirm(false)
                  submitAction()
                }}
                status={ComponentStatus.Default}
                text="OK"
              />
            </ClickOutside>
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <Button
      size={ComponentSize.ExtraSmall}
      color={ComponentColor.Primary}
      onClick={submitAction}
      status={isRunnable ? ComponentStatus.Default : ComponentStatus.Disabled}
      text="Submit"
      customClass="fqb--submit"
    />
  )
}

export default FluxQueryBuilderSubmit
