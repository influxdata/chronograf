import React, {Component, ChangeEvent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface TickscriptIDProps {
  onChangeID: (e: ChangeEvent<HTMLInputElement>) => void
  id: string
}

@ErrorHandling
class TickscriptID extends Component<TickscriptIDProps> {
  constructor(props) {
    super(props)
  }

  public render() {
    const {onChangeID, id} = this.props

    return (
      <input
        className="form-control input-sm form-malachite"
        autoFocus={true}
        value={id}
        onChange={onChangeID}
        placeholder="ID your TICKscript"
        spellCheck={false}
        autoComplete="off"
      />
    )
  }
}

export default TickscriptID
