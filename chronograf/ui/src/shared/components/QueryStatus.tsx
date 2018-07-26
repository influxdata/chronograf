import React, {PureComponent, ReactNode} from 'react'
import LoadingDots from 'src/shared/components/LoadingDots'
import classnames from 'classnames'
import {Status} from 'src/types'

interface Props {
  status: Status
  children?: ReactNode
  isShowingTemplateValues?: boolean
  isSubmitted?: boolean
}

class QueryStatus extends PureComponent<Props> {
  public render() {
    const {status, isShowingTemplateValues} = this.props

    if (isShowingTemplateValues) {
      return this.previewingStatus
    }

    if (this.isUnsubmitted) {
      return this.unsubmittedStatus
    }

    if (status.loading) {
      return this.loadingStatus
    }

    return this.resolvedStatus
  }

  private get resolvedStatus(): JSX.Element {
    const {status, children} = this.props

    return (
      <div className="query-editor--status">
        <span
          className={classnames('query-status-output', {
            'query-status-output--error': status.error,
            'query-status-output--success': status.success,
            'query-status-output--warning': status.warn,
          })}
        >
          <span
            className={classnames('icon', {
              stop: status.error,
              checkmark: status.success,
              'alert-triangle': status.warn,
            })}
          />
          {status.error || status.warn || status.success}
        </span>
        {children}
      </div>
    )
  }

  private get previewingStatus(): JSX.Element {
    return (
      <div className="query-editor--status">
        <span className="query-status-output">
          <span className="icon eye-open" />
          Previewing substituted Template Variable values, editing is disabled
        </span>
      </div>
    )
  }

  private get unsubmittedStatus(): JSX.Element {
    return (
      <div className="query-editor--status">
        <span className="query-status-output">
          <span className="icon alert-triangle" />
          Unsubmitted
        </span>
        {this.props.children}
      </div>
    )
  }

  private get loadingStatus(): JSX.Element {
    return (
      <div className="query-editor--status">
        <LoadingDots className="query-editor--loading" />
        {this.props.children}
      </div>
    )
  }

  private get isUnsubmitted(): boolean {
    return !(this.props.status && this.props.isSubmitted)
  }
}

export default QueryStatus
