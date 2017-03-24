import React, {PropTypes} from 'react'
import ConfirmButtons from 'src/admin/components/ConfirmButtons'

const DashboardEditHeader = ({
  dashboard,
}) => (
  <div className="page-header full-width">
    <div className="page-header__container">
      <div className="page-header__left">
        <input
          className="chronograf-header__editing"
          autoFocus={true}
          defaultValue={dashboard && dashboard.name}
          placeholder="Dashboard name"
        />
      </div>
      <ConfirmButtons onConfirm={() => {}} onCancel={() => {}} />
    </div>
  </div>
)

const {
  shape,
  func,
} = PropTypes

DashboardEditHeader.propTypes = {
  dashboard: shape({}),
}

export default DashboardEditHeader
