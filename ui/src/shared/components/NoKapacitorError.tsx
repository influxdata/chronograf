import React, {FunctionComponent} from 'react'
import {Link} from 'react-router'

import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

interface Props {
  source: {
    id: string
  }
}

const NoKapacitorError: FunctionComponent<Props> = ({source}) => {
  const path = `/sources/${source.id}/kapacitors/new`
  return (
    <div className="graph-empty">
      <p>
        The current source does not have an associated Kapacitor instance
        <br />
        <br />
        <Authorized requiredRole={EDITOR_ROLE}>
          <Link to={path} className="btn btn-sm btn-primary">
            Configure Kapacitor
          </Link>
        </Authorized>
      </p>
    </div>
  )
}

export default NoKapacitorError
