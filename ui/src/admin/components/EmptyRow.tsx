import * as React from 'react'

export interface EmptyRowProps {
  tableName: string
}

const EmptyRow: React.SFC<EmptyRowProps> = ({tableName}) => (
  <tr className="table-empty-state">
    <th colSpan={5}>
      <p>
        You don't have any {tableName},<br />why not create one?
      </p>
    </th>
  </tr>
)

export default EmptyRow
