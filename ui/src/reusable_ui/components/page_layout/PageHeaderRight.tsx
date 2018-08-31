// Libraries
import React, {Component, CSSProperties} from 'react'

// Constants
const DEFAULT_OFFSET = 0

interface Props {
  children: JSX.Element[] | JSX.Element | string | number
  offset?: number
}

class PageHeaderRight extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    offset: DEFAULT_OFFSET,
  }

  public render() {
    const {children} = this.props

    return (
      <div className="page-header--right" style={this.styles}>
        {children}
      </div>
    )
  }

  private get styles(): CSSProperties {
    const {offset} = this.props

    if (offset === DEFAULT_OFFSET) {
      return {
        flex: `1 0 ${offset}`,
      }
    }

    return {
      flex: `1 0 calc(100% - ${offset}px)`,
    }
  }
}

export default PageHeaderRight
