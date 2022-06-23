import React from 'react'
import {useMemo} from 'react'
import SubSections from 'src/shared/components/SubSections'
import {Source, SourceAuthenticationMethod} from 'src/types'
import {WrapToPage} from './AdminInfluxDBScopedPage'

interface Props {
  source: Source
  activeTab: 'databases' | 'users' | 'roles' | 'queries'
  children: JSX.Element | JSX.Element[]
}
export function hasRoleManagement(source: Source) {
  return !!source?.links?.roles
}
export function isConnectedToLDAP(source: Source) {
  return source.authentication === SourceAuthenticationMethod.LDAP
}

export const AdminTabs = ({source, activeTab, children}: Props) => {
  const sections = useMemo(() => {
    const hasRoles = hasRoleManagement(source)
    const isLDAP = isConnectedToLDAP(source)
    return [
      {
        url: 'databases',
        name: 'Databases',
        enabled: true,
      },
      {
        url: 'users',
        name: 'Users',
        enabled: !isLDAP,
      },
      {
        url: 'roles',
        name: 'Roles',
        enabled: hasRoles && !isLDAP,
      },
      {
        url: 'queries',
        name: 'Queries',
        enabled: true,
      },
    ]
  }, [source])
  return (
    <SubSections
      parentUrl="admin-influxdb"
      sourceID={source.id}
      activeSection={activeTab}
      sections={sections}
      position="top"
    >
      {children}
    </SubSections>
  )
}
const AdminInfluxDBTabbedPage = ({source, activeTab, children}: Props) => {
  return (
    <WrapToPage hideRefresh={activeTab === 'queries'}>
      <AdminTabs source={source} activeTab={activeTab}>
        {children}
      </AdminTabs>
    </WrapToPage>
  )
}
export default AdminInfluxDBTabbedPage
