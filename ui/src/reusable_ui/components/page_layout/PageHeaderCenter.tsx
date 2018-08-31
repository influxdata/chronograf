// Libraries
import React, {Component, CSSProperties} from 'react'

// Constants
const DEFAULT_WIDTH = 200
const MIN_CHILD_COUNT = 1

interface Props {
  children: JSX.Element[] | JSX.Element | string | number
  width?: number
}

class PageHeaderCenter extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    width: DEFAULT_WIDTH,
  }

  public render() {
    const {children} = this.props

    this.validateChildCount()

    return (
      <div className="page-header--center" style={this.styles}>
        {children}
      </div>
    )
  }

  private validateChildCount = (): void => {
    const {children} = this.props

    if (React.Children.count(children) < MIN_CHILD_COUNT) {
      throw new Error(
        'Page.Header.Left require at least 1 child element. We recommend using <Page.Title />'
      )
    }
  }

  private get styles(): CSSProperties {
    const {width} = this.props

    return {
      flex: `1 0 ${width}px`,
    }
  }
}

export default PageHeaderCenter
