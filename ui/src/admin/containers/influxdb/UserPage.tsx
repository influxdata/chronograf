import React, {useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {Database, User, UserPermission, UserRole} from 'src/types/influxAdmin'
import AdminInfluxDBTabbedPage, {
  hasRoleManagement,
  isConnectedToLDAP,
} from './AdminInfluxDBTabbedPage'
import {withRouter, WithRouterProps} from 'react-router'
import {useMemo} from 'react'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import {
  deleteUserAsync,
  updateUserPasswordAsync,
  updateUserPermissionsAsync,
} from 'src/admin/actions/influxdb'
import {Button, ComponentColor, ComponentStatus} from 'src/reusable_ui'
import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {useEffect} from 'react'

const mapStateToProps = ({
  adminInfluxDB: {databases, users, roles, permissions},
}) => ({
  databases,
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
  updateUserPermissionsAsync,
}

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  users: User[]
  roles: UserRole[]
  permissions: UserPermission[]
  databases: Database[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = WithRouterProps<RouterParams> &
  OwnProps &
  ConnectedProps &
  ReduxDispatchProps

const UserPageContent = ({
  users,
  databases,
  permissions: serverPermissions,
  source,
  router,
  params: {userName, sourceID},
  deleteUserAsync: deleteUserDispatchAsync,
  updateUserPasswordAsync: updatePasswordAsync,
  updateUserPermissionsAsync: updatePermissionsAsync,
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
  }, [source, users, userName])
  if (!user) {
    return (
      <div className="container-fluid">
        User <span className="error-warning">{userName}</span> not found!
      </div>
    )
  }
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
    [user, password]
  )
  const isOSS = !hasRoleManagement(source)
  const isAdmin =
    isOSS &&
    !!user.permissions.find(
      x => x.scope === 'all' && (x.allowed || []).includes('ALL')
    )
  const changeAdmin = useMemo(
    () => async () => {
      setRunning(true)
      try {
        let permissions = (user.permissions || []).filter(
          x => x.scope !== 'all'
        )
        if (!isAdmin) {
          permissions = [{scope: 'all', allowed: ['ALL']}, ...permissions]
        }
        await updatePermissionsAsync(user, permissions)
        setPassword(undefined)
      } finally {
        setRunning(false)
      }
    },
    [user, isAdmin]
  )
  const [dbPermisssions, userDBPermissions] = useMemo(
    () => [
      serverPermissions.find(x => x.scope === 'database')?.allowed || [],
      user.permissions.reduce((acc, perm) => {
        if (perm.scope === 'database') {
          const dbPerms = acc[perm.name] || (acc[perm.name] = {})
          perm.allowed.forEach(x => (dbPerms[x] = true))
        }
        return acc
      }, {}),
    ],
    [serverPermissions, user]
  )

  const [changedPermissions, setChangedPermissions] = useState<
    Record<string, Record<string, boolean | undefined>>
  >({})
  useEffect(() => {
    setChangedPermissions({})
  }, [user])
  const onPermissionChange = useMemo(
    () => (e: React.MouseEvent<HTMLSpanElement>) => {
      const db = (e.target as HTMLSpanElement).dataset.db
      const perm = (e.target as HTMLSpanElement).dataset.perm
      const origState = userDBPermissions[db]?.[perm]
      const {[db]: changedDB, ...otherDBs} = changedPermissions
      if (changedDB === undefined) {
        setChangedPermissions({[db]: {[perm]: !origState}, ...otherDBs})
      } else {
        const {[perm]: changedPerm, ...otherPerms} = changedDB
        if (changedPerm === undefined) {
          setChangedPermissions({
            [db]: {[perm]: !origState, ...otherPerms},
            ...otherDBs,
          })
        } else if (Object.keys(otherPerms).length) {
          // we are changing back has been already changed,
          // adjust changed database permissions
          setChangedPermissions({
            [db]: otherPerms,
            ...otherDBs,
          })
        } else {
          // there is no chnage for the current database
          setChangedPermissions(otherDBs)
        }
      }
      return
    },
    [userDBPermissions, changedPermissions, setChangedPermissions]
  )
  const permissionsChanged = !!Object.keys(changedPermissions).length
  const changePermissions = useMemo(
    () => async () => {
      if (Object.entries(changedPermissions).length === 0) {
        return
      }
      setRunning(true)
      try {
        const newUserDBPermisssions = {...userDBPermissions}
        Object.entries(changedPermissions).forEach(([db, perms]) => {
          if (newUserDBPermisssions[db]) {
            newUserDBPermisssions[db] = {
              ...newUserDBPermisssions[db],
              ...perms,
            }
          } else {
            newUserDBPermisssions[db] = {...perms}
          }
        })
        const permissions = Object.entries(newUserDBPermisssions).reduce(
          (acc, [db, permRecord]) => {
            const allowed = Object.entries(permRecord).reduce(
              (allowedAcc, [perm, use]) => {
                if (use) {
                  allowedAcc.push(perm)
                }
                return allowedAcc
              },
              []
            )
            if (allowed.length) {
              acc.push({scope: 'database', name: db, allowed})
            }
            return acc
          },
          (user.permissions || []).filter(x => x.scope !== 'database')
        )
        await updatePermissionsAsync(user, permissions)
      } finally {
        setRunning(false)
      }
    },
    [user, changedPermissions, userDBPermissions]
  )
  return (
    <div className="panel panel-solid influxdb-admin">
      <div className="panel-heading">
        <h2 className="panel-title">
          {password === undefined ? '' : 'Set password for user: '}
          <span title={`User: ${userName}`}>{userName}</span>
        </h2>
        {password === undefined && (
          <>
            <Button
              text="Change password"
              onClick={() => setPassword('')}
              status={
                running ? ComponentStatus.Disabled : ComponentStatus.Default
              }
            />
            {isOSS && (
              <ConfirmButton
                type="btn-default"
                text={isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                confirmText={
                  isAdmin ? 'Revoke ALL Privileges' : 'Grant ALL Privileges'
                }
                confirmAction={changeAdmin}
                disabled={running}
                position="bottom"
              ></ConfirmButton>
            )}
            <ConfirmButton
              type="btn-danger"
              text="Delete User"
              confirmAction={deleteUser}
              disabled={running}
              position="bottom"
            ></ConfirmButton>
          </>
        )}
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
        ) : (
          <FancyScrollbar>
            <div className="db-manager">
              <div className="db-manager-header privileges">
                <h4>
                  Database Privileges{permissionsChanged ? ' (unsaved)' : ''}
                </h4>
                {permissionsChanged && (
                  <Button
                    text="Apply Changes"
                    onClick={changePermissions}
                    color={ComponentColor.Secondary}
                    status={
                      running
                        ? ComponentStatus.Disabled
                        : ComponentStatus.Default
                    }
                  />
                )}
              </div>
              <div className="db-manager-body">
                {isAdmin && (
                  <div className="db-manager-text">
                    The user is an <b>admin</b>, ALL PRIVILEGES are granted
                    irrespectively of database permissions.
                  </div>
                )}
                <div className="db-manager-table">
                  <table className="table v-center table-highlight">
                    <thead>
                      <tr>
                        <th style={{minWidth: '100px', whiteSpace: 'nowrap'}}>
                          Database
                        </th>
                        <th style={{width: '99%', whiteSpace: 'nowrap'}}>
                          Priviledges
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(databases || []).map(db => (
                        <tr key={db.name}>
                          <td>{db.name}</td>
                          <td>
                            {dbPermisssions.map((perm, i) => (
                              <span
                                key={i}
                                title="Click to change, click Apply Changes to save all changes"
                                data-db={db.name}
                                data-perm={perm}
                                className={`permission-value ${
                                  userDBPermissions[db.name]?.[perm]
                                    ? 'granted'
                                    : 'denied'
                                } ${
                                  changedPermissions[db.name]?.[perm] !==
                                  undefined
                                    ? 'perm-changed'
                                    : ''
                                }`}
                                onClick={onPermissionChange}
                              >
                                {perm}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </FancyScrollbar>
        )}
      </div>
    </div>
  )
}

const UserPage = (props: Props) => (
  <AdminInfluxDBTabbedPage activeTab="users" source={props.source}>
    <UserPageContent {...props} />
  </AdminInfluxDBTabbedPage>
)
export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(UserPage))
)
