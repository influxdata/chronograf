import React, {SFC, ReactElement} from 'react'
import _ from 'lodash'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

interface Query {
  database: string
  query: string
  source: string
  text: string
}

interface Props {
  visualization: ReactElement<any>
  queries: Query[]
  onSummonOverlay: () => void
}

const LayoutCellBody: SFC<Props> = ({
  visualization,
  queries,
  onSummonOverlay,
}) => {
  if (_.isEmpty(queries)) {
    return (
      <div className="dash-graph--container">
        <div className="graph-empty">
          <Authorized requiredRole={EDITOR_ROLE}>
            <button
              className="no-query--button btn btn-md btn-primary"
              onClick={onSummonOverlay}
            >
              <span className="icon plus" /> Add Data
            </button>
          </Authorized>
        </div>
      </div>
    )
  }

  return <div className="dash-graph--container">{visualization}</div>
}

export default LayoutCellBody
