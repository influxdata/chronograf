// Libraries
import React, {PureComponent} from 'react'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Args {
  name: string
  type: string
  desc: string
}

interface Props {
  argsList?: Args[]
}

@ErrorHandling
class TooltipArguments extends PureComponent<Props> {
  public render() {
    return (
      <article>
        <div className="flux-functions-toolbar--heading">Arguments</div>
        <div className="flux-functions-toolbar--snippet">{this.arguments}</div>
      </article>
    )
  }

  private get arguments(): JSX.Element | JSX.Element[] {
    const {argsList} = this.props

    if (argsList.length > 0) {
      return argsList.map(a => {
        return (
          <div className="flux-functions-toolbar--arguments" key={a.name}>
            <span>{a.name}:</span>
            <span>{a.type}</span>
            <div>{a.desc}</div>
          </div>
        )
      })
    }

    return <div className="flux-functions-toolbar--arguments">None</div>
  }
}

export default TooltipArguments
