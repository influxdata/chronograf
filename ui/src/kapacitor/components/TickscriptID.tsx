import * as React from 'react'

import {eFunc} from 'src/types/funcs'

export interface TickscriptIDProps {
  onChangeID: eFunc
  id: string
}

const TickscriptID: React.SFC<TickscriptIDProps> = ({onChangeID, id}) => (
  <input
    className="page-header--editing kapacitor-theme"
    autoFocus={true}
    value={id}
    onChange={onChangeID}
    placeholder="ID your TICKscript"
    spellCheck={false}
    autoComplete="false"
  />
)

export interface TickscriptStaticIDProps {
  id: string
}

export const TickscriptStaticID: React.SFC<TickscriptStaticIDProps> = ({
  id,
}) => (
  <h1
    className="page-header--editing kapacitor-theme"
    style={{display: 'flex', justifyContent: 'baseline'}}
  >
    {id}
  </h1>
)

export default TickscriptID
