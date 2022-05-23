import React, {useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {User} from 'src/types/influxAdmin'
import AdminInfluxDBTab, {isConnectedToLDAP} from './AdminInfluxDBTab'
import {withRouter, WithRouterProps} from 'react-router'
import {useMemo} from 'react'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import {deleteUserAsync} from 'src/admin/actions/influxdb'

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
  users,
  roles,
  permissions,
})

interface RouterParams {
  sourceID: string
  userName: string
}

const mapDispatchToProps = {
  deleteUserAsync,
}

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

const UserPageContent = ({
  users,
  source,
  params: {userName, sourceID},
  deleteUserAsync: deleteUserDispatchAsync,
  router,
}: Props) => {
  if (isConnectedToLDAP(source)) {
    return <div className="container-fluid">Users are managed via LDAP.</div>
  }
  const [running, setRunning] = useState(0)
  const [user, deleteUser] = useMemo(() => {
    const u = users.find(x => x.name === userName)
    return [
      u,
      async () => {
        setRunning(running + 1)
        try {
          await deleteUserDispatchAsync(u)
          router.push(`/sources/${sourceID}/admin-influxdb/users`)
        } finally {
          setRunning(running - 1)
        }
      },
    ]
  }, [source, users, userName, running, setRunning])
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
        <h2 className="panel-title" style={{flex: '1 1 auto'}}>
          User {userName}
        </h2>
        <ConfirmButton
          type="btn-danger"
          text="Delete User"
          confirmAction={deleteUser}
          disabled={!!running}
        ></ConfirmButton>
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
