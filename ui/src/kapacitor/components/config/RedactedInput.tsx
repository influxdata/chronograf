import * as React from 'react'

export interface RedactedInputProps {
  id: string
  defaultValue: boolean | string
  refFunc: (r: {}) => void
}

export interface RedactedInputState {
  editing: boolean
}

class RedactedInput extends React.Component<
  RedactedInputProps,
  RedactedInputState
> {
  public state = {
    editing: false,
  }

  private handleClick = () => {
    this.setState({editing: true})
  }

  public render() {
    const {defaultValue, id, refFunc} = this.props
    const {editing} = this.state

    if (defaultValue === true && !editing) {
      return (
        <div className="form-control-static redacted-input">
          <span className="alert-value-set">
            <span className="icon checkmark" /> Value set
          </span>
          <button className="btn btn-xs btn-link" onClick={this.handleClick}>
            Change
          </button>
          <input
            className="form-control"
            id={id}
            type="hidden"
            ref={refFunc}
            defaultValue={`${defaultValue}`}
          />
        </div>
      )
    }

    return (
      <input
        className="form-control"
        id={id}
        type="text"
        ref={refFunc}
        defaultValue={''}
      />
    )
  }
}

export default RedactedInput
