import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {dismissOverlay as dismissOverlayAction} from 'shared/actions/overlay'

class Overlay extends Component {
  constructor(props) {
    super(props)

    this.state = {
      visible: false,
    }
  }
  componentWillReceiveProps = nextProps => {
    if (!this.props.childNode && nextProps.childNode) {
      this.fadeInTimeout = setTimeout(this.handleFadeIn, 20)
    }
  }

  handleFadeIn = () => {
    this.setState({visible: true})
  }

  handleDismiss = () => {
    const {dismissOverlay} = this.props

    this.setState({visible: false})
    this.dismissTimeout = setTimeout(dismissOverlay, 252)
  }

  render() {
    const {visible} = this.state
    const {childNode} = this.props

    const overlayClass = `overlay-container${visible ? ' show' : ''}`

    return (
      <div className={overlayClass}>
        <div className="overlay-window">
          {childNode &&
            React.cloneElement(childNode, {
              onDismissOverlay: this.handleDismiss,
            })}
        </div>
        <div className="overlay-mask" />
      </div>
    )
  }
}

const {func, node} = PropTypes

Overlay.propTypes = {
  childNode: node,
  dismissOverlay: func.isRequired,
}

const mapStateToProps = ({overlay: {childNode}}) => ({
  childNode,
})

const mapDispatchToProps = dispatch => ({
  dismissOverlay: bindActionCreators(dismissOverlayAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Overlay)
