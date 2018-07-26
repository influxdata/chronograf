import React, {SFC} from 'react'

import AnnotationPoint from 'src/shared/components/AnnotationPoint'
import AnnotationSpan from 'src/shared/components/AnnotationSpan'

import {AnnotationInterface, DygraphClass} from 'src/types'

interface Props {
  mode: string
  xAxisRange: [number, number]
  annotation: AnnotationInterface
  dygraph: DygraphClass
  staticLegendHeight: number
}

const Annotation: SFC<Props> = ({
  mode,
  dygraph,
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
        staticLegendHeight={staticLegendHeight}
        xAxisRange={xAxisRange}
      />
    ) : (
      <AnnotationSpan
        mode={mode}
        dygraph={dygraph}
        annotation={annotation}
        staticLegendHeight={staticLegendHeight}
        xAxisRange={xAxisRange}
      />
    )}
  </div>
)

export default Annotation
