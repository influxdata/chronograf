import React from 'react'
import {useMemo} from 'react'
import SubSections from 'src/shared/components/SubSections'
import {Source, SourceAuthenticationMethod} from 'src/types'
import {PageSection} from 'src/types/shared'
import {WrapToPage} from './AdminInfluxDBScopedPage'
import {
  SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED,
  SOURCE_TYPE_INFLUX_V3_CORE,
  SOURCE_TYPE_INFLUX_V3_ENTERPRISE,
} from 'src/shared/constants'

interface Props {
  source: Source
  activeTab: 'databases' | 'users' | 'roles' | 'queries'
  children: JSX.Element | JSX.Element[]
  onTabChange?: (section: PageSection, url: string) => void
}
export function hasRoleManagement(source: Source) {
  return !!source?.links?.roles
}
export function isConnectedToLDAP(source: Source) {
  return source.authentication === SourceAuthenticationMethod.LDAP
}

export function isV3Source(source: Source) {
  return (
    source.type === SOURCE_TYPE_INFLUX_V3_CORE ||
    source.type === SOURCE_TYPE_INFLUX_V3_ENTERPRISE ||
    source.type === SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED
  )
}

export const AdminTabs = ({
  source,
  activeTab,
  children,
  onTabChange,
}: Props) => {
  const sections = useMemo(() => {
    const hasRoles = hasRoleManagement(source)
    const isLDAP = isConnectedToLDAP(source)
    const isV3 = isV3Source(source)
    return [
      {
        url: 'databases',
        name: 'Databases',
        enabled: true,
      },
      {
        url: 'users',
        name: 'Users',
        enabled: !isLDAP && !isV3,
      },
      {
        url: 'roles',
        name: 'Roles',
        enabled: hasRoles && !isLDAP && !isV3,
      },
      {
        url: 'queries',
        name: 'Queries',
        enabled: !isV3,
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
      onTabChange={onTabChange}
    >
      {children}
    </SubSections>
  )
}
const AdminInfluxDBTabbedPage = ({
  source,
  activeTab,
  children,
  onTabChange,
}: Props) => {
  return (
    <WrapToPage hideRefresh={activeTab === 'queries'}>
      <AdminTabs
        source={source}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        {children}
      </AdminTabs>
    </WrapToPage>
  )
}
export default AdminInfluxDBTabbedPage
