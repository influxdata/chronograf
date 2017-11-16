import * as React from 'react'
import * as classnames from 'classnames'
import {Scrollbars} from 'react-custom-scrollbars'

export interface FancyScrollbarProps {
  className?: string
  autoHide?: boolean
  autoHeight?: boolean
  maxHeight?: number
}

class FancyScrollbar extends React.Component<FancyScrollbarProps> {
  public static defaultProps = {
    autoHide: true,
    autoHeight: false,
  }

  private handleMakeDiv = className => props => {
    return <div {...props} className={`fancy-scroll--${className}`} />
  }

  public render() {
    const {autoHide, autoHeight, children, className, maxHeight} = this.props

    return (
      <Scrollbars
        className={classnames('fancy-scroll--container', className)}
        autoHide={autoHide}
        autoHideTimeout={1000}
        autoHideDuration={250}
        autoHeight={autoHeight}
        autoHeightMax={maxHeight}
        renderTrackHorizontal={this.handleMakeDiv('track-h')}
        renderTrackVertical={this.handleMakeDiv('track-v')}
        renderThumbHorizontal={this.handleMakeDiv('thumb-h')}
        renderThumbVertical={this.handleMakeDiv('thumb-v')}
        renderView={this.handleMakeDiv('view')}
      >
        {children}
      </Scrollbars>
    )
  }
}

export default FancyScrollbar
