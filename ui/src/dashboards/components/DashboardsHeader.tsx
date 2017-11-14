import * as React from 'react'

import SourceIndicator from 'shared/components/SourceIndicator'

import {Source} from 'src/types'

export interface DashboardsHeaderProps {
  source: Source
}

const DashboardsHeader: React.SFC<DashboardsHeaderProps> = ({source}) => (
  <div className="page-header">
    <div className="page-header__container">
      <div className="page-header__left">
        <h1 className="page-header__title">Dashboards</h1>
      </div>
      <div className="page-header__right">
        <SourceIndicator source={source} />
      </div>
    </div>
  </div>
)

export default DashboardsHeader
