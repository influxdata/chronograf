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
}

interface Props {
  formattedValue: string | JSX.Element
  notify: NotificationAction
  onExpand?: () => void
  searchPattern: string
  maxWidth: number
}

const PADDING = 8
const MIN_LEFT = 120
const MIN_MESSAGE_WIDTH = 200
const MAX_MESSAGE_HEIGHT = 200
const SCROLL_MARGIN = 80

@ErrorHandling
export class ExpandableMessage extends Component<Props, State> {
  private containerRef: React.RefObject<HTMLDivElement>

  constructor(props: Props) {
    super(props)
    this.containerRef = React.createRef()
    this.state = {
      expanded: false,
    }
  }

  public render() {
    return (
      <div
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
    const valueString = `${formattedValue}`
    const trimmedValue = valueString.trimLeft()

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
        padding={PADDING}
        top={top}
        left={left}
        minLeft={MIN_LEFT}
        width={width}
      >
        {this.message}
      </ExpandedContainer>
    )

    return ReactDOM.createPortal(message, portalElement)
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
    })
  }
}

export default ExpandableMessage
