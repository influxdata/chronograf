import React from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {User} from 'src/types/influxAdmin'
import AdminInfluxDBTab, {isConnectedToLDAP} from './AdminInfluxDBTab'
import {withRouter, WithRouterProps} from 'react-router'
import {useMemo} from 'react'

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
  users,
  roles,
  permissions,
})

interface RouterParams {
  sourceID: string
  userName: string
}

const mapDispatchToProps = {}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  users: User[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = WithRouterProps<RouterParams> &
  OwnProps &
  ConnectedProps &
  ReduxDispatchProps

const UserPageContent = ({users, source, params: {userName}}: Props) => {
  if (isConnectedToLDAP(source)) {
    return <div className="container-fluid">Users are managed via LDAP.</div>
  }
  const user = useMemo(() => users.find(x => x.name === userName), [
    source,
    users,
    userName,
  ])
  if (!user) {
    return (
      <div className="container-fluid">
        User <span className="error-warning">{userName}</span> not found!
      </div>
    )
  }

  return (
    <div className="panel panel-solid influxdb-admin">
      <div className="panel-heading">
        <h2 className="panel-title">User {userName}</h2>
      </div>
      <div className="panel-body"></div>
    </div>
  )
}

const UserPage = (props: Props) => (
  <AdminInfluxDBTab activeTab="users" source={props.source}>
    <UserPageContent {...props} />
  </AdminInfluxDBTab>
)
export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(UserPage))
)
