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
        Have questions? Read the{' '}
        <a target="_blank" href={link}>
          InfluxDB 2.0 Docs
        </a>
      </p>
    )
  }
}

export default TooltipLink
