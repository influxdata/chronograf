import React, {useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {User} from 'src/types/influxAdmin'
import AdminInfluxDBTab, {isConnectedToLDAP} from './AdminInfluxDBTab'
import {withRouter, WithRouterProps} from 'react-router'
import {useMemo} from 'react'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import {
  deleteUserAsync,
  updateUserPasswordAsync,
} from 'src/admin/actions/influxdb'
import {Button, ComponentStatus} from 'src/reusable_ui'
import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'

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
  updateUserPasswordAsync,
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
  router,
  params: {userName, sourceID},
  deleteUserAsync: deleteUserDispatchAsync,
  updateUserPasswordAsync: updatePasswordAsync,
}: Props) => {
  if (isConnectedToLDAP(source)) {
    return <div className="container-fluid">Users are managed via LDAP.</div>
  }
  const [running, setRunning] = useState(false)
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [user, deleteUser] = useMemo(() => {
    const u = users.find(x => x.name === userName)
    return [
      u,
      async () => {
        setRunning(true)
        try {
          await deleteUserDispatchAsync(u)
          router.push(`/sources/${sourceID}/admin-influxdb/users`)
        } finally {
          setRunning(false)
        }
      },
    ]
  }, [source, users, userName, running, setRunning])
  const updatePassword = useMemo(
    () => async () => {
      setRunning(true)
      try {
        await updatePasswordAsync(user, password)
        setPassword(undefined)
      } finally {
        setRunning(false)
      }
    },
    [user, password, running]
  )
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
        <h2 className="panel-title">
          {password === undefined ? '' : 'Set password for user: '}
          <span title={`User: ${userName}`}>{userName}</span>
        </h2>
        {password === undefined ? (
          <>
            <Button
              text="Change password"
              onClick={() => setPassword('')}
              status={
                running ? ComponentStatus.Disabled : ComponentStatus.Default
              }
            />
            <ConfirmButton
              type="btn-danger"
              text="Delete User"
              confirmAction={deleteUser}
              disabled={running}
              position="bottom"
            ></ConfirmButton>
          </>
        ) : null}
      </div>
      <div className="panel-body">
        {password !== undefined ? (
          <div
            style={{
              display: 'flex',
              justifyItems: 'flex-start',
              alignItems: 'center',
              columnGap: '10px',
            }}
          >
            <input
              className="form-control input-sm"
              name="password"
              type="password"
              value={password}
              placeholder="New Password"
              disabled={running}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  updatePassword()
                }
              }}
              style={{flex: '0 0 auto', width: '200px'}}
              spellCheck={false}
              autoComplete="false"
            />
            <ConfirmOrCancel
              item={user}
              onConfirm={updatePassword}
              isDisabled={running}
              onCancel={() => setPassword(undefined)}
              buttonSize="btn-sm"
            />
          </div>
        ) : null}
      </div>
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
