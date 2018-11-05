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
  scrollMargin: number
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

enum PinnedState {
  Left = 'PinnedLeft',
  Right = 'PinnedRight',
  Center = 'PinnedCenter',
  OnMessage = 'PinnedOnMessage',
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
        <div className="expanded--message message-wrap" style={this.style}>
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
      </ClickOutside>
    )
  }

  private get maxHeight(): number {
    return this.props.maxHeight - this.verticalPadding
  }

  private get verticalPadding(): number {
    return this.props.padding * 2
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

  private get style(): CSSProperties {
    return {
      ...this.position,
      top: this.props.top,
      width: this.width,
      padding: this.props.padding,
      maxHeight: this.props.maxHeight,
    }
  }

  private get position(): CSSProperties {
    switch (this.pinnedState) {
      case PinnedState.Left:
        return {left: this.props.minLeft}
      case PinnedState.Right:
        return {left: this.props.minLeft + this.props.scrollMargin}
      case PinnedState.Center:
        return {left: this.props.minLeft}
      case PinnedState.OnMessage:
        return {left: this.props.left}
    }
  }

  private get width(): number {
    switch (this.pinnedState) {
      case PinnedState.Left:
      case PinnedState.Right:
        return (
          this.props.maxWidth - this.props.scrollMargin - this.props.padding
        )
      case PinnedState.Center:
        return this.props.maxWidth - this.props.padding
      case PinnedState.OnMessage:
        return this.props.width
    }
  }

  private get pinnedState(): PinnedState {
    const isLeftOutOfView = this.props.left < this.props.minLeft
    const isRightOfView =
      this.props.width + this.props.left - this.props.minLeft >
      this.props.maxWidth

    if (isLeftOutOfView && isRightOfView) {
      return PinnedState.Center
    } else if (!isLeftOutOfView && !isRightOfView) {
      return PinnedState.OnMessage
    } else if (!isRightOfView) {
      return PinnedState.Left
    } else if (!isLeftOutOfView) {
      return PinnedState.Right
    }
  }

  private get closeExpansionButton(): JSX.Element {
    return (
      <button className="expanded--dismiss" onClick={this.handleClickDismiss} />
    )
  }
}

export default ExpandedContainer
