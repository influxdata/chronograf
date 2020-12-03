import React, {FunctionComponent} from 'react'

interface Props {
  onAddQuery: () => void
}

const EmptyQueryState: FunctionComponent<Props> = ({onAddQuery}) => (
  <div className="query-maker--empty">
    <h5>This Graph has no Queries</h5>
    <br />
    <div className="btn btn-primary" onClick={onAddQuery}>
      <span className="icon plus" /> Add a Query
    </div>
  </div>
)

export default EmptyQueryState
