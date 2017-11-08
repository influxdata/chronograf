import * as React from 'react'

export interface DisplayOptionsInput {
  name: string
  id: string
  value: string
  onChange: () => void
  labelText: string
}

const DisplayOptionsInput: React.SFC<DisplayOptionsInput> = ({
  id,
  name,
  value = '',
  onChange,
  labelText,
}) => (
  <div className="form-group col-sm-6">
    <label htmlFor={name}>{labelText}</label>
    <input
      className="form-control input-sm"
      type="text"
      name={name}
      id={id}
      value={value}
      onChange={onChange}
    />
  </div>
)

export default DisplayOptionsInput
