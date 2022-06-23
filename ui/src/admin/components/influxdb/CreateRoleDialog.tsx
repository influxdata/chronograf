import React, {useCallback, useState} from 'react'
import {
  ComponentStatus,
  Form,
  Input,
  OverlayBody,
  OverlayContainer,
  OverlayHeading,
  OverlayTechnology,
} from 'src/reusable_ui'

const minLen = 3
export function validateRoleName(name: string): boolean {
  return name?.length >= minLen
}

interface Props {
  create: (role: {name: string}) => void
  setVisible: (visible: boolean) => void
  visible: boolean
}
const CreateRoleDialog = ({visible, setVisible, create}: Props) => {
  const [name, setName] = useState('')
  const cancel = useCallback(() => {
    setName('')
    setVisible(false)
  }, [])
  const onEnterPressed = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && name) {
        e.stopPropagation()
        create({name})
      }
    },
    [name, create]
  )
  return (
    <OverlayTechnology visible={visible}>
      <OverlayContainer maxWidth={650}>
        <OverlayHeading title="Create Role" onDismiss={cancel} />
        <OverlayBody>
          <form>
            <Form>
              <Form.Element label="Role Name">
                <Input
                  value={name}
                  autoFocus={true}
                  autoComplete="off"
                  onChange={e => setName(e.target.value)}
                  onKeyPress={onEnterPressed}
                  status={
                    validateRoleName(name)
                      ? ComponentStatus.Valid
                      : ComponentStatus.Default
                  }
                  testId="role-name--input"
                />
              </Form.Element>
              <Form.Footer>
                <div className="form-group text-center form-group-submit col-xs-12">
                  <button
                    className="btn btn-sm btn-default"
                    onClick={cancel}
                    type="button"
                    data-test="form--cancel-role--button"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    disabled={!name}
                    type="button"
                    onClick={() => create({name})}
                    data-test="form--create-role--button"
                  >
                    Create
                  </button>
                </div>
              </Form.Footer>
            </Form>
          </form>
        </OverlayBody>
      </OverlayContainer>
    </OverlayTechnology>
  )
}

export default CreateRoleDialog
