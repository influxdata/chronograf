// Libraries
import React, {PureComponent} from 'react'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  description: string
}

@ErrorHandling
class TooltipDescription extends PureComponent<Props> {
  public render() {
    const {description} = this.props

    return (
      <article className="flux-functions-toolbar--description">
        <div className="flux-functions-toolbar--heading">Description</div>
        <span>{description}</span>
      </article>
    )
  }
}

export default TooltipDescription
