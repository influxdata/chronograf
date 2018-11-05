// Libraries
import React, {PureComponent} from 'react'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  link: string
}

@ErrorHandling
class TooltipLink extends PureComponent<Props> {
  public render() {
    const {link} = this.props

    return (
      <p>
        Still have questions? Check out the{' '}
        <a target="_blank" href={link}>
          Flux Docs
        </a>
        .
      </p>
    )
  }
}

export default TooltipLink
