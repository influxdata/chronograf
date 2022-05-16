import React, {ReactNode} from 'react'
import {useMemo} from 'react'
import SubSections from 'src/shared/components/SubSections'
import {Source, SourceAuthenticationMethod} from 'src/types'

interface Props {
  source: Source
  activeTab: 'databases' | 'users' | 'roles' | 'queries'
  children: ReactNode
}

const AdminInfluxDBScopedPage = ({source, activeTab, children}: Props) => {
  const sections = useMemo(() => {
    const hasRoles = !!source?.links?.roles
    const isLDAP = source.authentication === SourceAuthenticationMethod.LDAP
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
    <div className="container-fluid">
      <SubSections
        parentUrl="admin-influxdb"
        sourceID={source.id}
        activeSection={activeTab}
        sections={sections}
      >
        {children}
      </SubSections>
    </div>
  )
}
export default AdminInfluxDBScopedPage
