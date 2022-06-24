import React, {useState} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Source} from 'src/types'
import {Database, User, UserPermission, UserRole} from 'src/types/influxAdmin'
import {
  AdminTabs,
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
  updateUserRolesAsync,
} from 'src/admin/actions/influxdb'
import {Button, ComponentColor, ComponentStatus, Page} from 'src/reusable_ui'
import ConfirmOrCancel from 'src/shared/components/ConfirmOrCancel'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {useEffect} from 'react'
import {useCallback} from 'react'
import {PERMISSIONS} from 'src/shared/constants'
import {
  computePermissions,
  computePermissionsChange,
  toUserPermissions,
} from '../../util/permissions'

const FAKE_USER: User = {
  name: '',
  permissions: [],
  roles: [],
  links: {self: ''},
}

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
  updateUserRolesAsync,
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

const UserPage = ({
  users,
  databases,
  permissions: serverPermissions,
  roles,
  source,
  router,
  params: {userName, sourceID},
  deleteUserAsync: deleteUserDispatchAsync,
  updateUserPasswordAsync: updatePasswordAsync,
  updateUserPermissionsAsync: updatePermissionsAsync,
  updateUserRolesAsync: updateRolesAsync,
}: Props) => {
  if (isConnectedToLDAP(source)) {
    return <div className="container-fluid">Users are managed via LDAP.</div>
  }
  const [running, setRunning] = useState(false)
  const [password, setPassword] = useState<string | undefined>(undefined)
  const [user, deleteUser] = useMemo(() => {
    const u = users.find(x => x.name === userName) || FAKE_USER
    return [
      u,
      async () => {
        setRunning(true)
        try {
          await deleteUserDispatchAsync(u)
        } finally {
          setRunning(false)
        }
        router.push(`/sources/${sourceID}/admin-influxdb/users`)
      },
    ]
  }, [source, users, userName])
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
  const isEnterprise = hasRoleManagement(source)

  // admin
  const isAdmin =
    !isEnterprise &&
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

  // permissions
  const [
    dbPermisssions,
    clusterPermissions,
    userDBPermissions,
  ] = useMemo(
    () => [
      serverPermissions.find(x => x.scope === 'database')?.allowed || [],
      serverPermissions.find(x => x.scope === 'all')?.allowed || [],
      computePermissions(user, isEnterprise),
    ],
    [serverPermissions, user, isEnterprise]
  )
  const [changedPermissions, setChangedPermissions] = useState<
    Record<string, Record<string, boolean | undefined>>
  >({})
  useEffect(() => {
    setChangedPermissions({})
  }, [user])
  const onPermissionChange = useMemo(
    () => (e: React.MouseEvent<HTMLElement>) => {
      const db = (e.target as HTMLElement).dataset.db
      const perm = (e.target as HTMLElement).dataset.perm
      setChangedPermissions(
        computePermissionsChange(
          db,
          perm,
          userDBPermissions,
          changedPermissions
        )
      )
    },
    [userDBPermissions, changedPermissions]
  )
  const permissionsChanged = !!Object.keys(changedPermissions).length
  const changePermissions = useMemo(
    () => async () => {
      if (Object.entries(changedPermissions).length === 0) {
        return true
      }
      setRunning(true)
      try {
        // append to existing all-scoped permissions in OSS, they manage administrator status
        const permissions = toUserPermissions(
          userDBPermissions,
          changedPermissions,
          isEnterprise ? [] : user.permissions.filter(x => x.scope === 'all')
        )
        return await updatePermissionsAsync(user, permissions)
      } finally {
        setRunning(false)
      }
    },
    [user, changedPermissions, userDBPermissions, isEnterprise]
  )

  // roles
  const [allRoleNames, rolesRecord] = useMemo(() => {
    if (!isEnterprise) {
      return [[], {}]
    }
    const rNames = (isEnterprise ? roles : []).map(r => r.name).sort()
    const urRecord = user.roles.reduce<Record<string, boolean>>((acc, r) => {
      acc[r.name] = true
      return acc
    }, {})
    return [rNames, urRecord]
  }, [user, roles, isEnterprise])
  const [changedRolesRecord, setChangedRolesRecord] = useState<
    Record<string, boolean>
  >({})
  useEffect(() => setChangedRolesRecord({}), [user])
  const rolesChanged = useMemo(() => !!Object.keys(changedRolesRecord).length, [
    changedRolesRecord,
  ])
  const onRoleChange = useMemo(
    () => (e: React.MouseEvent<HTMLElement>) => {
      const role = (e.target as HTMLElement).dataset.role
      const {[role]: roleChanged, ...restChanged} = changedRolesRecord
      if (roleChanged === undefined) {
        setChangedRolesRecord({
          ...changedRolesRecord,
          [role]: !rolesRecord[role],
        })
      } else {
        // returning back to original state
        setChangedRolesRecord(restChanged)
      }
      return
    },
    [rolesRecord, changedRolesRecord]
  )
  const changeRoles = useMemo(
    () => async () => {
      if (Object.entries(changedRolesRecord).length === 0) {
        return true
      }
      setRunning(true)
      try {
        const newRoles = roles.reduce<UserRole[]>((acc, role) => {
          const roleName = role.name
          if (
            changedRolesRecord[roleName] === true ||
            (changedRolesRecord[roleName] === undefined &&
              rolesRecord[roleName])
          ) {
            acc.push(role)
          }
          return acc
        }, [])
        return await updateRolesAsync(user, newRoles)
      } finally {
        setRunning(false)
      }
    },
    [user, rolesRecord, changedRolesRecord, roles]
  )

  const dataChanged = useMemo(() => permissionsChanged || rolesChanged, [
    permissionsChanged,
    rolesChanged,
  ])
  const exitHandler = useCallback(() => {
    router.push(`/sources/${sourceID}/admin-influxdb/users`)
  }, [router, source])
  const changeData = useCallback(async () => {
    if ((await changeRoles()) && (await changePermissions())) {
      exitHandler()
    }
  }, [changePermissions, changeRoles, exitHandler])
  const databaseNames = useMemo<string[]>(
    () =>
      databases.reduce(
        (acc, db) => {
          acc.push(db.name)
          return acc
        },
        isEnterprise ? [''] : []
      ),
    [isEnterprise, databases]
  )
  const body =
    user === FAKE_USER ? (
      <div className="container-fluid">
        User <span className="error-warning">{userName}</span> not found!
      </div>
    ) : (
      <div className="panel panel-solid influxdb-admin">
        <div className="panel-heading">
          <h2 className="panel-title">
            {password === undefined ? '' : 'Set password for user: '}
            <span title={`User: ${userName}`}>{userName}</span>
          </h2>
          {password === undefined && (
            <div className="panel-heading--right">
              <Button
                text="Change password"
                onClick={() => setPassword('')}
                status={
                  running ? ComponentStatus.Disabled : ComponentStatus.Default
                }
                testId="change-password--button"
              />
              {!isEnterprise && (
                <ConfirmButton
                  type="btn-default"
                  text={isAdmin ? 'Revoke Admin' : 'Grant Admin'}
                  confirmText={
                    isAdmin ? 'Revoke ALL Privileges' : 'Grant ALL Privileges'
                  }
                  confirmAction={changeAdmin}
                  disabled={running}
                  position="bottom"
                  testId={`${isAdmin ? 'revoke' : 'grant'}-admin--button`}
                ></ConfirmButton>
              )}
              <ConfirmButton
                type="btn-danger"
                text="Delete User"
                confirmAction={deleteUser}
                disabled={running}
                position="bottom"
                testId="delete-user--button"
              ></ConfirmButton>
            </div>
          )}
        </div>
        <div className="panel-body influxdb-admin--detail">
          {password !== undefined ? (
            <div className="influxdb-admin--pwdchange">
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
                data-test="new-password--input"
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
              {isEnterprise && (
                <>
                  <div className="infludb-admin-section__header">
                    <h4>
                      Roles
                      {rolesChanged ? ' (unsaved)' : ''}
                    </h4>
                  </div>
                  <div className="infludb-admin-section__body">
                    {!allRoleNames.length ? (
                      <p>No roles are defined.</p>
                    ) : (
                      <div className="collection-selector">
                        {allRoleNames.map((roleName, i) => (
                          <div
                            key={i}
                            title="Click to change, click Apply Changes to save all changes"
                            data-role={roleName}
                            className={`role-value ${
                              rolesRecord[roleName] ? 'granted' : 'denied'
                            } ${
                              changedRolesRecord[roleName] !== undefined
                                ? 'value-changed'
                                : ''
                            }`}
                            onClick={onRoleChange}
                            data-test={`role-${roleName}--button`}
                          >
                            {roleName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="infludb-admin-section__header">
                <h4>
                  {isEnterprise ? 'Permissions' : 'Database Permissions'}
                  {permissionsChanged ? ' (unsaved)' : ''}
                </h4>
              </div>
              <div className="infludb-admin-section__body">
                {isAdmin && (
                  <p data-test="user-is-admin--text">
                    The user is an <b>admin</b>, ALL PRIVILEGES are granted
                    irrespectively of database permissions.
                  </p>
                )}
                <div>
                  <table
                    className="table v-center table-highlight permission-table"
                    data-test="permission-table"
                  >
                    <thead>
                      <tr>
                        <th style={{minWidth: '100px', whiteSpace: 'nowrap'}}>
                          Database
                        </th>
                        <th style={{width: '99%', whiteSpace: 'nowrap'}}>
                          Permissions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(databaseNames || []).map(db => (
                        <tr
                          key={db}
                          className={db ? '' : 'all-databases'}
                          title={
                            db
                              ? db
                              : 'Cluster-Wide Permissions applies to all databases'
                          }
                          data-test={`${
                            db ? db : 'all-databases'
                          }-permissions--row`}
                        >
                          <td>{db || '*'}</td>
                          <td>
                            {(db ? dbPermisssions : clusterPermissions).map(
                              (perm, i) => (
                                <div
                                  key={i}
                                  title={
                                    PERMISSIONS[perm]?.description ||
                                    'Click to change, click Apply Changes to save all changes'
                                  }
                                  data-db={db}
                                  data-perm={perm}
                                  className={`permission-value ${
                                    userDBPermissions[db]?.[perm]
                                      ? 'granted'
                                      : 'denied'
                                  } ${
                                    changedPermissions[db]?.[perm] !== undefined
                                      ? 'value-changed'
                                      : ''
                                  }`}
                                  onClick={onPermissionChange}
                                  data-test={`${db}-${perm}-permission--button`}
                                >
                                  {perm}
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </FancyScrollbar>
          )}
        </div>
      </div>
    )
  return (
    <Page className="influxdb-admin">
      <Page.Header fullWidth={true}>
        <Page.Header.Left>
          <Page.Title title="InfluxDB User" />
        </Page.Header.Left>
        <Page.Header.Right showSourceIndicator={true}>
          {dataChanged ? (
            <ConfirmButton
              text="Exit"
              confirmText="Discard unsaved changes?"
              confirmAction={exitHandler}
              position="left"
              testId="discard-changes--exit--button"
            />
          ) : (
            <Button text="Exit" onClick={exitHandler} testId="exit--button" />
          )}
          {dataChanged && (
            <Button
              text="Apply Changes"
              onClick={changeData}
              color={ComponentColor.Primary}
              status={
                running ? ComponentStatus.Disabled : ComponentStatus.Default
              }
              testId="apply-changes--button"
            />
          )}
        </Page.Header.Right>
      </Page.Header>
      <div className="influxdb-admin--contents">
        <AdminTabs activeTab="users" source={source}>
          {body}
        </AdminTabs>
      </div>
    </Page>
  )
}

export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(UserPage))
)
