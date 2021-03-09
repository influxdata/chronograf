import React, {FunctionComponent} from 'react'

import AnnotationPoint from 'src/shared/components/AnnotationPoint'
import AnnotationSpan from 'src/shared/components/AnnotationSpan'

import {Annotation as AnnotationProp, DygraphClass} from 'src/types'

interface Props {
  mode: string
  dWidth: number
  xAxisRange: [number, number]
  annotation: AnnotationProp
  dygraph: DygraphClass
  staticLegendHeight: number
}

const Annotation: FunctionComponent<Props> = ({
  mode,
  dygraph,
  dWidth,
  xAxisRange,
  annotation,
  staticLegendHeight,
}) => (
  <div>
    {annotation.startTime === annotation.endTime ? (
      <AnnotationPoint
        mode={mode}
        dygraph={dygraph}
        annotation={annotation}
        dWidth={dWidth}
        staticLegendHeight={staticLegendHeight}
        xAxisRange={xAxisRange}
      />
    ) : (
      <AnnotationSpan
        mode={mode}
        dygraph={dygraph}
        annotation={annotation}
        dWidth={dWidth}
        staticLegendHeight={staticLegendHeight}
        xAxisRange={xAxisRange}
      />
    )}
  </div>
)

export default Annotation
