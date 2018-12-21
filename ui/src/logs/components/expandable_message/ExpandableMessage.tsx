// Libraries
import React, {Component} from 'react'
import ReactDOM from 'react-dom'

// Components
import LogsMessage from 'src/logs/components/logs_message/LogsMessage'
import {ExpandedContainer} from 'src/logs/components/expandable_message/ExpandedContainer'

// Types
import {NotificationAction} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface State {
  expanded: boolean
  hovered: boolean
}

interface Props {
  formattedValue: string | JSX.Element
  notify: NotificationAction
  onExpand?: () => void
  searchPattern?: string
  maxWidth: number
  colWidth?: number
}

const PADDING = 8
const MIN_LEFT = 120
const MIN_MESSAGE_WIDTH = 200
const MIN_MESSAGE_HEIGHT = 25
const MAX_MESSAGE_HEIGHT = 200
const SCROLL_MARGIN = 80

@ErrorHandling
export class ExpandableMessage extends Component<Props, State> {
  private containerRef: React.RefObject<HTMLDivElement>
  private mouseOver: NodeJS.Timer

  constructor(props: Props) {
    super(props)
    this.containerRef = React.createRef()
    this.state = {
      expanded: false,
      hovered: false,
    }
  }

  public render() {
    return (
      <div
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleClick}
        className="expandable--message"
        ref={this.containerRef}
      >
        {this.message}
        {this.expandedMessage}
      </div>
    )
  }

  private get message(): JSX.Element {
    const {notify, searchPattern, formattedValue} = this.props
    let trimmedValue = formattedValue

    if (typeof formattedValue === 'string') {
      const valueString = `${formattedValue}`
      trimmedValue = valueString.trimLeft()
    }

    return (
      <LogsMessage
        formattedValue={trimmedValue}
        notify={notify}
        searchPattern={searchPattern}
      />
    )
  }

  private get expandedMessage() {
    const {expanded} = this.state

    if (!expanded || !this.containerRef.current) {
      return null
    }

    const portalElement = document.getElementById('expanded-message-container')
    const containerRect = this.containerRef.current.getBoundingClientRect()

    const {top, left, width} = containerRect

    const message = (
      <ExpandedContainer
        notify={this.props.notify}
        onClose={this.handleClose}
        scrollMargin={SCROLL_MARGIN}
        maxWidth={this.props.maxWidth}
        minWidth={MIN_MESSAGE_WIDTH}
        maxHeight={MAX_MESSAGE_HEIGHT}
        minHeight={MIN_MESSAGE_HEIGHT}
        padding={PADDING}
        top={top}
        left={left}
        minLeft={MIN_LEFT}
        width={this.props.colWidth || width}
      >
        {this.message}
      </ExpandedContainer>
    )

    return ReactDOM.createPortal(message, portalElement)
  }

  private handleMouseOver = () => {
    this.setState({hovered: true})

    this.mouseOver = setTimeout(() => {
      if (this.state.hovered) {
        // ensure clickoutside to close other popovers
        document.body.click()
        this.handleClick()
      }
    }, 1500)
  }

  private handleMouseLeave = () => {
    clearTimeout(this.mouseOver)

    if (!this.state.expanded) {
      this.handleClose()
    }
  }
  private handleClick = () => {
    const {expanded} = this.state
    const {onExpand} = this.props
    if (!expanded && onExpand) {
      onExpand()
    }

    this.setState({
      expanded: true,
    })
  }

  private handleClose = () => {
    this.setState({
      expanded: false,
      hovered: false,
    })
  }
}

export default ExpandableMessage
