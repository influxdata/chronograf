import React from 'react'
import DeleteConfirmButtons from 'shared/components/DeleteConfirmButtons'

const DeleteConfirmTableCell = (props) => (
  <td className="text-right" style={{width: "85px"}}>
    <DeleteConfirmButtons {...props} />
  </td>
)

export default DeleteConfirmTableCell
