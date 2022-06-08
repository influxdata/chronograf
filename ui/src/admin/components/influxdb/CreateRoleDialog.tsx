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
  return (
    <OverlayTechnology visible={visible}>
      <OverlayContainer maxWidth={650}>
        <OverlayHeading title="Create Role" onDismiss={cancel} />
        <OverlayBody>
          <Form>
            <Form.Element label="Role Name">
              <Input
                value={name}
                autoFocus={true}
                onChange={e => setName(e.target.value)}
                status={
                  validateRoleName(name)
                    ? ComponentStatus.Valid
                    : ComponentStatus.Default
                }
              />
            </Form.Element>
            <Form.Footer>
              <div className="form-group text-center form-group-submit col-xs-12">
                <button className="btn btn-sm btn-default" onClick={cancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-sm btn-success"
                  disabled={!name}
                  onClick={() => create({name})}
                >
                  Create
                </button>
              </div>
            </Form.Footer>
          </Form>
        </OverlayBody>
      </OverlayContainer>
    </OverlayTechnology>
  )
}

export default CreateRoleDialog
