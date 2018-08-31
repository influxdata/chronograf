// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: JSX.Element[] | JSX.Element
  fullWidth?: boolean
  scrollable?: boolean
}

@ErrorHandling
class PageContents extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    fullWidth: false,
    scrollable: true,
  }

  public render() {
    const {scrollable} = this.props

    if (scrollable) {
      return (
        <FancyScrollbar className={this.className}>
          {this.children}
        </FancyScrollbar>
      )
    }
    return <div className={this.className}>{this.children}</div>
  }

  private get children(): JSX.Element[] | JSX.Element {
    const {children, fullWidth} = this.props

    if (fullWidth) {
      return children
    }

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">{children}</div>
        </div>
      </div>
    )
  }

  private get className(): string {
    const {fullWidth} = this.props

    return classnames('page-contents', {'full-width': fullWidth})
  }
}

export default PageContents
