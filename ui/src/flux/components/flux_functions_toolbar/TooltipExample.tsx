// Libraries
import React, {PureComponent} from 'react'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  example: string
}

@ErrorHandling
class TooltipExample extends PureComponent<Props> {
  public render() {
    const {example} = this.props

    return (
      <article>
        <div className="flux-functions-toolbar--heading">Example</div>
        <div className="flux-functions-toolbar--snippet">{example}</div>
      </article>
    )
  }
}

export default TooltipExample
