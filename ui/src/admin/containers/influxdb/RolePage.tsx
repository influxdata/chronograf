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
  deleteRoleAsync,
  updateRolePermissionsAsync,
  updateRoleUsersAsync,
} from 'src/admin/actions/influxdb'
import {Button, ComponentColor, ComponentStatus, Page} from 'src/reusable_ui'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {useEffect} from 'react'
import {useCallback} from 'react'
import {PERMISSIONS} from 'src/shared/constants'
import {
  computePermissions,
  computePermissionsChange,
  toUserPermissions,
} from '../../util/permissions'
import ConfirmDiscardDialog from 'src/admin/components/influxdb/ConfirmDiscardDialog'

const FAKE_ROLE: UserRole = {
  name: '',
  permissions: [],
  users: [],
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
  roleName: string
}

const mapDispatchToProps = {
  deleteRoleAsync,
  updateRolePermissionsAsync,
  updateRoleUsersAsync,
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

const RolePage = ({
  users,
  databases,
  permissions: serverPermissions,
  roles,
  source,
  router,
  params: {roleName, sourceID},
  deleteRoleAsync: deleteAsync,
  updateRolePermissionsAsync: updatePermissionsAsync,
  updateRoleUsersAsync: updateUsersAsync,
}: Props) => {
  if (!hasRoleManagement(source)) {
    return (
      <div className="container-fluid">
        Role management is not available for the currently selected InfluxDB
        Connection.
      </div>
    )
  }
  if (isConnectedToLDAP(source)) {
    return (
      <div className="container-fluid">
        Users are managed via LDAP, roles management is not available.
      </div>
    )
  }
  const [running, setRunning] = useState(false)
  const [role, deleteRole] = useMemo(() => {
    const r = roles.find(x => x.name === roleName) || FAKE_ROLE
    return [
      r,
      async () => {
        setRunning(true)
        try {
          await deleteAsync(r)
        } finally {
          setRunning(false)
        }
        router.push(`/sources/${sourceID}/admin-influxdb/roles`)
      },
    ]
  }, [source, roles, roleName])

  // permissions
  const [
    dbPermisssions,
    clusterPermissions,
    roleDBPermissions,
  ] = useMemo(
    () => [
      serverPermissions.find(x => x.scope === 'database')?.allowed || [],
      serverPermissions.find(x => x.scope === 'all')?.allowed || [],
      computePermissions(role, true),
    ],
    [serverPermissions, role]
  )
  const [changedPermissions, setChangedPermissions] = useState<
    Record<string, Record<string, boolean | undefined>>
  >({})
  useEffect(() => {
    setChangedPermissions({})
  }, [role])
  const onPermissionChange = useMemo(
    () => (e: React.MouseEvent<HTMLElement>) => {
      const db = (e.target as HTMLElement).dataset.db
      const perm = (e.target as HTMLElement).dataset.perm
      setChangedPermissions(
        computePermissionsChange(
          db,
          perm,
          roleDBPermissions,
          changedPermissions
        )
      )
    },
    [roleDBPermissions, changedPermissions]
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
          roleDBPermissions,
          changedPermissions
        )
        return await updatePermissionsAsync(role, permissions)
      } finally {
        setRunning(false)
      }
    },
    [role, changedPermissions, roleDBPermissions]
  )

  // users
  const [allUserNames, usersRecord] = useMemo(() => {
    const uNames = users.map(r => r.name).sort()
    const ruRecord = role.users.reduce<Record<string, boolean>>((acc, r) => {
      acc[r.name] = true
      return acc
    }, {})
    return [uNames, ruRecord]
  }, [role, users])
  const [changedUsersRecord, setChangedUsersRecord] = useState<
    Record<string, boolean>
  >({})
  useEffect(() => setChangedUsersRecord({}), [role])
  const usersChanged = useMemo(() => !!Object.keys(changedUsersRecord).length, [
    changedUsersRecord,
  ])
  const onUserChange = useMemo(
    () => (e: React.MouseEvent<HTMLElement>) => {
      const user = (e.target as HTMLElement).dataset.user
      const {[user]: roleChanged, ...restChanged} = changedUsersRecord
      if (roleChanged === undefined) {
        setChangedUsersRecord({
          ...changedUsersRecord,
          [user]: !usersRecord[user],
        })
      } else {
        // returning back to original state
        setChangedUsersRecord(restChanged)
      }
      return
    },
    [usersRecord, changedUsersRecord]
  )
  const changeUsers = useMemo(
    () => async () => {
      if (Object.entries(changedUsersRecord).length === 0) {
        return true
      }
      setRunning(true)
      try {
        const newUsers = users.reduce<User[]>((acc, user) => {
          const userName = user.name
          if (
            changedUsersRecord[userName] === true ||
            (changedUsersRecord[userName] === undefined &&
              usersRecord[userName])
          ) {
            acc.push(user)
          }
          return acc
        }, [])
        return await updateUsersAsync(role, newUsers)
      } finally {
        setRunning(false)
      }
    },
    [role, usersRecord, changedUsersRecord, users]
  )

  const dataChanged = useMemo(() => permissionsChanged || usersChanged, [
    permissionsChanged,
    usersChanged,
  ])
  const exitHandler = useCallback(() => {
    router.push(`/sources/${sourceID}/admin-influxdb/roles`)
  }, [router, source])
  const changeData = useCallback(async () => {
    if ((await changeUsers()) && (await changePermissions())) {
      exitHandler()
    }
  }, [changePermissions, changeUsers, exitHandler])
  const databaseNames = useMemo<string[]>(
    () =>
      databases.reduce(
        (acc, db) => {
          acc.push(db.name)
          return acc
        },
        ['']
      ),
    [databases]
  )

  const [exitUrl, setExitUrl] = useState('')
  const onTabChange = useCallback(
    (_section, url) => {
      if (dataChanged) {
        setExitUrl(url)
        return
      }
      router.push(url)
    },
    [router, dataChanged]
  )
  const onExitCancel = useCallback(() => {
    setExitUrl('')
  }, [])
  const onExitConfirm = useCallback(() => {
    router.push(exitUrl)
  }, [router, exitUrl])

  const body =
    role === FAKE_ROLE ? (
      <div className="container-fluid">
        Role <span className="error-warning">{roleName}</span> not found!
      </div>
    ) : (
      <div className="panel panel-solid influxdb-admin">
        <div className="panel-heading">
          <h2 className="panel-title">
            <span title={`Role: ${roleName}`}>{roleName}</span>
          </h2>
          <div className="panel-heading--right">
            <ConfirmButton
              type="btn-danger"
              text="Delete Role"
              confirmAction={deleteRole}
              disabled={running}
              position="bottom"
            ></ConfirmButton>
          </div>
        </div>
        <div className="panel-body influxdb-admin--detail">
          <FancyScrollbar>
            <div className="infludb-admin-section__header">
              <h4>
                Users
                {usersChanged ? ' (unsaved)' : ''}
              </h4>
            </div>
            <div className="infludb-admin-section__body">
              {!allUserNames.length ? (
                <p>No users are defined.</p>
              ) : (
                <div className="collection-selector">
                  {allUserNames.map((userName, i) => (
                    <div
                      key={i}
                      title="Click to change, click Apply Changes to save all changes"
                      data-user={userName}
                      className={`user-value ${
                        usersRecord[userName] ? 'granted' : 'denied'
                      } ${
                        changedUsersRecord[userName] !== undefined
                          ? 'value-changed'
                          : ''
                      }`}
                      onClick={onUserChange}
                      data-test={`user-${userName}--selector`}
                    >
                      {userName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="infludb-admin-section__header">
              <h4>
                Permissions
                {permissionsChanged ? ' (unsaved)' : ''}
              </h4>
            </div>
            <div className="infludb-admin-section__body">
              <div>
                <table className="table v-center table-highlight permission-table">
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
                        data-test={`${db || 'all'}-db-perm--row`}
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
                                  roleDBPermissions[db]?.[perm]
                                    ? 'granted'
                                    : 'denied'
                                } ${
                                  changedPermissions[db]?.[perm] !== undefined
                                    ? 'value-changed'
                                    : ''
                                }`}
                                onClick={onPermissionChange}
                                data-test={`${perm}--value`}
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
        </div>
      </div>
    )
  return (
    <Page className="influxdb-admin">
      <Page.Header fullWidth={true}>
        <Page.Header.Left>
          <Page.Title title="InfluxDB Role" />
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
        <AdminTabs activeTab="roles" source={source} onTabChange={onTabChange}>
          <ConfirmDiscardDialog
            onOK={onExitConfirm}
            onCancel={onExitCancel}
            visible={!!exitUrl}
          />
          {body}
        </AdminTabs>
      </div>
    </Page>
  )
}

export default withSource(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(RolePage))
)
