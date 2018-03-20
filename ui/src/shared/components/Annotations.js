import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import Annotation from 'src/shared/components/Annotation'
import NewAnnotation from 'src/shared/components/NewAnnotation'
import * as schema from 'src/shared/schemas'

import {ADDING, TEMP_ANNOTATION} from 'src/shared/annotations/helpers'

import {
  updateAnnotation,
  addingAnnotationSuccess,
  dismissAddingAnnotation,
  mouseEnterTempAnnotation,
  mouseLeaveTempAnnotation,
} from 'src/shared/actions/annotations'
import {visibleAnnotations} from 'src/shared/annotations/helpers'

class Annotations extends Component {
  state = {
    lastUpdated: null,
  }

  componentDidMount() {
    this.props.annotationsRef(this)
  }

  heartbeat = () => {
    this.setState({lastUpdated: Date.now()})
  }

  render() {
    const {lastUpdated} = this.state
    const {
      mode,
      dygraph,
      isTempHovering,
      handleUpdateAnnotation,
      handleDismissAddingAnnotation,
      handleAddingAnnotationSuccess,
      handleMouseEnterTempAnnotation,
      handleMouseLeaveTempAnnotation,
      staticLegendHeight,
    } = this.props

    const annotations = visibleAnnotations(
      dygraph,
      this.props.annotations
    ).filter(a => a.id !== TEMP_ANNOTATION.id)
    const tempAnnotation = this.props.annotations.find(
      a => a.id === TEMP_ANNOTATION.id
    )

    return (
      <div className="annotations-container">
        {mode === ADDING &&
          tempAnnotation && (
            <NewAnnotation
              dygraph={dygraph}
              tempAnnotation={tempAnnotation}
              onDismissAddingAnnotation={handleDismissAddingAnnotation}
              onAddingAnnotationSuccess={handleAddingAnnotationSuccess}
              onUpdateAnnotation={handleUpdateAnnotation}
              isTempHovering={isTempHovering}
              onMouseEnterTempAnnotation={handleMouseEnterTempAnnotation}
              onMouseLeaveTempAnnotation={handleMouseLeaveTempAnnotation}
              staticLegendHeight={staticLegendHeight}
            />
          )}
        {annotations.map(a => (
          <Annotation
            key={a.id}
            mode={mode}
            annotation={a}
            dygraph={dygraph}
            staticLegendHeight={staticLegendHeight}
            lastUpdated={lastUpdated}
          />
        ))}
      </div>
    )
  }
}

const {arrayOf, bool, func, number, shape, string} = PropTypes

Annotations.propTypes = {
  annotations: arrayOf(schema.annotation),
  dygraph: shape({}),
  mode: string,
  isTempHovering: bool,
  annotationsRef: func,
  handleUpdateAnnotation: func.isRequired,
  handleDismissAddingAnnotation: func.isRequired,
  handleAddingAnnotationSuccess: func.isRequired,
  handleMouseEnterTempAnnotation: func.isRequired,
  handleMouseLeaveTempAnnotation: func.isRequired,
  staticLegendHeight: number,
}

const mapStateToProps = ({
  annotations: {annotations, mode, isTempHovering},
}) => ({
  annotations,
  mode: mode || 'NORMAL',
  isTempHovering,
})

const mapDispatchToProps = dispatch => ({
  handleAddingAnnotationSuccess: bindActionCreators(
    addingAnnotationSuccess,
    dispatch
  ),
  handleDismissAddingAnnotation: bindActionCreators(
    dismissAddingAnnotation,
    dispatch
  ),
  handleMouseEnterTempAnnotation: bindActionCreators(
    mouseEnterTempAnnotation,
    dispatch
  ),
  handleMouseLeaveTempAnnotation: bindActionCreators(
    mouseLeaveTempAnnotation,
    dispatch
  ),
  handleUpdateAnnotation: bindActionCreators(updateAnnotation, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(Annotations)
