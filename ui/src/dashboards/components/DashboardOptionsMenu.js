import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {presentationButtonDispatcher} from 'shared/dispatchers'
import {templateControlBarVisibilityToggled} from 'shared/actions/app'
import OnClickOutside from 'shared/components/OnClickOutside'

class DashboardOptionsMenu extends Component {
  constructor(props) {
    super(props)

    this.state = {
      expanded: false,
    }
  }

  handleToggleMenu = () => {
    this.setState({expanded: !this.state.expanded})
  }

  handleCollapseMenu = () => {
    this.setState({expanded: false})
  }

  handleClickOutside() {
    this.handleCollapseMenu()
  }

  handleItemClick = action => () => {
    this.handleCollapseMenu()
    action()
  }

  render() {
    const {expanded} = this.state
    const {
      showTemplateControlBar,
      onToggleTemplateControlBar,
      onEnterPresentationMode,
      isEditableDashboard,
    } = this.props

    const containerClass = `dashboard-options-menu ${
      expanded ? 'expanded' : ''
    }`

    const buttonClass = `btn btn-sm btn-default btn-square ${
      expanded ? 'active' : ''
    }`

    const tempVarItemLabel = `${
      showTemplateControlBar ? 'Hide' : 'Show'
    } Template Variable Controls`

    return (
      <div className={containerClass}>
        <div className={buttonClass} onClick={this.handleToggleMenu}>
          <span className="icon cog-thick" />
        </div>
        <div className="dashboard-options-menu--menu">
          <div
            className="dashboard-options-menu--item"
            onClick={this.handleItemClick(onEnterPresentationMode)}
          >
            <span className="icon expand-a" />
            Presentation Mode
          </div>
          {isEditableDashboard && (
            <div
              className="dashboard-options-menu--item"
              onClick={this.handleItemClick(onToggleTemplateControlBar)}
            >
              <span className="icon cube" />
              {tempVarItemLabel}
            </div>
          )}
        </div>
      </div>
    )
  }
}

const {bool, func} = PropTypes

DashboardOptionsMenu.propTypes = {
  onEnterPresentationMode: func.isRequired,
  onToggleTemplateControlBar: func.isRequired,
  showTemplateControlBar: bool,
  isEditableDashboard: bool,
}

const mapStateToProps = ({app: {persisted: {showTemplateControlBar}}}) => ({
  showTemplateControlBar,
})

const mapDispatchToProps = dispatch => ({
  onEnterPresentationMode: presentationButtonDispatcher(dispatch),
  onToggleTemplateControlBar: bindActionCreators(
    templateControlBarVisibilityToggled,
    dispatch
  ),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  OnClickOutside(DashboardOptionsMenu)
)
