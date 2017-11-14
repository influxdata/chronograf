import * as React from 'react'
import * as classnames from 'classnames'
import {withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'

import {
  publishNotification as publishNotificationAction,
  dismissNotification as dismissNotificationAction,
  dismissAllNotifications as dismissAllNotificationsAction,
} from 'shared/actions/notifications'

import {Location} from 'src/types'

export interface NotificationsProps {
  location: Location
  publishNotification: () => void
  dismissNotification: (type: string) => void
  dismissAllNotifications: () => void
  notifications: {
    success?: string
    error?: string
    warning?: string
  }
}

class Notifications extends React.Component<NotificationsProps> {
  private renderNotification = (type, message) => {
    if (!message) {
      return null
    }
    const cls = classnames('alert', {
      'alert-danger': type === 'error',
      'alert-success': type === 'success',
      'alert-warning': type === 'warning',
    })
    return (
      <div className={cls} role="alert">
        {message}
        {this.renderDismiss(type)}
      </div>
    )
  }

  private handleDismiss = type => () => this.props.dismissNotification(type)

  private renderDismiss = type => {
    return (
      <button
        className="close"
        data-dismiss="alert"
        aria-label="Close"
        onClick={this.handleDismiss(type)}
      >
        <span className="icon remove" />
      </button>
    )
  }

  public componentWillReceiveProps(nextProps: NotificationsProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.props.dismissAllNotifications()
    }
  }

  public render() {
    const {success, error, warning} = this.props.notifications
    if (!success && !error && !warning) {
      return null
    }

    return (
      <div className="flash-messages">
        {this.renderNotification('success', success)}
        {this.renderNotification('error', error)}
        {this.renderNotification('warning', warning)}
      </div>
    )
  }
}

const mapStateToProps = ({notifications}) => ({
  notifications,
})

const mapDispatchToProps = dispatch => ({
  publishNotification: bindActionCreators(publishNotificationAction, dispatch),
  dismissNotification: bindActionCreators(dismissNotificationAction, dispatch),
  dismissAllNotifications: bindActionCreators(
    dismissAllNotificationsAction,
    dispatch
  ),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Notifications)
