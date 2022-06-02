import React, {FunctionComponent} from 'react'

interface Props {
  entities: string
  colSpan?: number
  filtered?: boolean
}
const EmptyRow: FunctionComponent<Props> = ({entities, colSpan, filtered}) => (
  <tr className="table-empty-state">
    <th colSpan={colSpan || 5}>
      {filtered ? (
        <p>No Matching {entities}</p>
      ) : (
        <p>
          You don't have any {entities},<br />
          why not create one?
        </p>
      )}
    </th>
  </tr>
)

export default EmptyRow
