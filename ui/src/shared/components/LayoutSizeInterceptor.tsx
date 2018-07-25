import React, {Component, CSSProperties} from 'react'

interface Props {
  children: JSX.Element
  onInterceptStyle: (style: CSSProperties) => void
  style?: CSSProperties
  className?: string
  onMouseDown?: () => void
  onMouseUp?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
}

class Interceptor extends Component<Props> {
  public componentDidMount() {
    const {onInterceptStyle, style} = this.props

    onInterceptStyle(style)
  }

  public componentDidUpdate() {
    const {onInterceptStyle, style} = this.props

    onInterceptStyle(style)
  }

  public render() {
    const {
      children,
      style,
      className,
      onMouseDown,
      onMouseUp,
      onTouchStart,
      onTouchEnd,
    } = this.props

    console.log(children)

    return (
      <div
        style={style}
        className={className}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    )
  }
}

export default Interceptor
