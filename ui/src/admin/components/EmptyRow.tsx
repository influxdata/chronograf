import React, {FunctionComponent} from 'react'

interface Props {
  tableName: string
  colSpan?: number
  filtered?: boolean
}
const EmptyRow: FunctionComponent<Props> = ({tableName, colSpan, filtered}) => (
  <tr className="table-empty-state">
    <th colSpan={colSpan || 5}>
      {filtered ? (
        <p>No Matching Users</p>
      ) : (
        <p>
          You don't have any {tableName},<br />
          why not create one?
        </p>
      )}
    </th>
  </tr>
)

export default EmptyRow
