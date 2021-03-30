import React, {Component} from 'react'
import {connect} from 'react-redux'

import AnnotationComponent from 'src/shared/components/Annotation'
import NewAnnotation from 'src/shared/components/NewAnnotation'
import {SourceContext} from 'src/CheckSources'

import {getSelectedAnnotations} from 'src/shared/selectors/annotations'
import {ADDING} from 'src/shared/annotations/helpers'

import {visibleAnnotations} from 'src/shared/annotations/helpers'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Annotation, DygraphClass, Source} from 'src/types'

interface Props {
  dWidth: number
  staticLegendHeight: number
  annotations: Annotation[]
  mode: string
  xAxisRange: [number, number]
  dygraph: DygraphClass
  isTempHovering: boolean
  addingAnnotation?: Annotation
  handleAddingAnnotationSuccess: () => void
  handleMouseEnterTempAnnotation: () => void
  handleMouseLeaveTempAnnotation: () => void
}

@ErrorHandling
class Annotations extends Component<Props> {
  public render() {
    const {
      mode,
      dWidth,
      dygraph,
      xAxisRange,
      annotations,
      isTempHovering,
      addingAnnotation,
      handleAddingAnnotationSuccess,
      handleMouseEnterTempAnnotation,
      handleMouseLeaveTempAnnotation,
      staticLegendHeight,
    } = this.props
    return (
      <div className="annotations-container">
        {mode === ADDING && addingAnnotation && (
          <SourceContext.Consumer>
            {(source: Source) => (
              <NewAnnotation
                dygraph={dygraph}
                source={source}
                isTempHovering={isTempHovering}
                addingAnnotation={addingAnnotation}
                staticLegendHeight={staticLegendHeight}
                onAddingAnnotationSuccess={handleAddingAnnotationSuccess}
                onMouseEnterTempAnnotation={handleMouseEnterTempAnnotation}
                onMouseLeaveTempAnnotation={handleMouseLeaveTempAnnotation}
              />
            )}
          </SourceContext.Consumer>
        )}
        {annotations.map(a => (
          <AnnotationComponent
            key={a.id}
            mode={mode}
            xAxisRange={xAxisRange}
            annotation={a}
            dygraph={dygraph}
            dWidth={dWidth}
            staticLegendHeight={staticLegendHeight}
          />
        ))}
      </div>
    )
  }
}

const mstp = (state, props) => {
  const {mode, isTempHovering, addingAnnotation} = state.annotations

  const annotations = visibleAnnotations(
    props.xAxisRange,
    getSelectedAnnotations(state)
  )

  return {
    annotations,
    addingAnnotation,
    mode: mode || 'NORMAL',
    isTempHovering,
  }
}

export default connect(mstp)(Annotations)
