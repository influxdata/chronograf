// Libraries
import React, {Component, MouseEvent, CSSProperties} from 'react'

// Components
import {ClickOutside} from 'src/shared/components/ClickOutside'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Types
import {NotificationAction} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  notify: NotificationAction
  onClose: () => void
  maxWidth: number
  maxHeight: number
  minWidth: number
  minLeft: number
  width: number
  left: number
  top: number
  padding: number
  children: JSX.Element
}

interface State {
  scrollTop: number
}

@ErrorHandling
export class ExpandedContainer extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {scrollTop: 0}
  }

  public render() {
    return (
      <ClickOutside onClickOutside={this.handleClickOutside}>
        {this.renderMessage({
          top: this.top,
          left: this.maxLeft,
          width: this.visibleWidth,
          padding: this.props.padding,
          maxHeight: this.props.maxHeight,
        })}
      </ClickOutside>
    )
  }

  private renderMessage(style: CSSProperties): JSX.Element {
    if (style.width < this.props.minWidth) {
      return this.props.children
    }

    return (
      <div className="expanded--message message-wrap" style={style}>
        {this.closeExpansionButton}
        <FancyScrollbar
          setScrollTop={this.handleScrollbarScroll}
          scrollTop={this.state.scrollTop}
          autoHeight={true}
          maxHeight={this.maxHeight}
        >
          {this.props.children}
        </FancyScrollbar>
      </div>
    )
  }

  private get direction(): string {
    if (this.props.left > this.props.minLeft) {
      return 'right'
    } else {
      return 'left'
    }
  }

  private get maxHeight(): number {
    return this.props.maxHeight - this.verticalPadding
  }

  private get verticalPadding(): number {
    return this.props.padding * 2
  }

  private get top(): number {
    return this.props.top - this.props.padding
  }

  private handleClickDismiss = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()

    this.props.onClose()
  }

  private handleScrollbarScroll = (e: MouseEvent<HTMLElement>): void => {
    e.stopPropagation()
    e.preventDefault()
    const {scrollTop} = e.currentTarget

    this.setState({scrollTop})
  }

  private handleClickOutside = () => {
    this.props.onClose()
  }

  private get maxLeft(): number {
    return Math.max(this.props.minLeft, this.props.left - this.props.padding)
  }

  private get visibleWidth(): number {
    return Math.min(
      this.remainingWidth,
      this.maxViewableWidth,
      this.props.width
    )
  }

  private get remainingWidth(): number {
    if (this.props.left > this.props.minLeft) {
      return this.props.maxWidth - this.hiddenWidth
    } else {
      return this.props.width + this.hiddenWidth
    }
  }

  private get hiddenWidth(): number {
    return this.props.left - this.props.minLeft
  }

  // Table space with room for scrollbar
  private get maxViewableWidth(): number {
    return this.props.maxWidth - this.props.padding
  }

  private get closeExpansionButton(): JSX.Element {
    return (
      <button className="expanded--dismiss" onClick={this.handleClickDismiss} />
    )
  }
}

export default ExpandedContainer
