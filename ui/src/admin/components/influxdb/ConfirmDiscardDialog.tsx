import React from 'react'
import {
  Form,
  OverlayContainer,
  OverlayHeading,
  OverlayTechnology,
} from 'src/reusable_ui'

const minLen = 3
export function validateRoleName(name: string): boolean {
  return name?.length >= minLen
}

interface Props {
  onCancel: () => void
  onOK: () => void
  visible: boolean
}
const ConfirmDiscardDialog = ({visible, onOK, onCancel}: Props) => {
  return (
    <OverlayTechnology visible={visible}>
      <OverlayContainer maxWidth={400}>
        <OverlayHeading title="Discard unsaved changes?" />
        <div
          className="overlay--body"
          style={{minHeight: '100px', padding: '0px'}}
        >
          <form>
            <Form>
              {[
                <Form.Footer key={1}>
                  <div className="form-group text-center col-xs-12">
                    <button
                      className="btn btn-sm btn-warning"
                      type="button"
                      onClick={onOK}
                      data-test="confirm--ok--button"
                    >
                      OK
                    </button>
                    <button
                      className="btn btn-sm btn-default"
                      onClick={onCancel}
                      type="button"
                      data-test="confirm--cancel--button"
                    >
                      Cancel
                    </button>
                  </div>
                </Form.Footer>,
              ]}
            </Form>
          </form>
        </div>
      </OverlayContainer>
    </OverlayTechnology>
  )
}

export default ConfirmDiscardDialog
