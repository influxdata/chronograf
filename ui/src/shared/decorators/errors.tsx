/*
tslint:disable no-console
tslint:disable max-classes-per-file
*/
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import React, {ComponentClass, Component} from 'react'
import {VERSION} from 'src/shared/constants'

type ErrorComponentClass = ComponentClass<{error: Error} & any>

export class DefaultError extends Component<{error: Error}> {
  public render() {
    const {error} = this.props
    const {stack, message} = error
    const finalMessage = ` Chronograf (${VERSION}) ${message}`
    const mdMarker = '```'
    const template = `

What browser are you using (name and version)?

What operating system are you using?

Please describe what you were trying to do when you encountered this error:

${mdMarker}
${stack}
${mdMarker}

    `
    const href = encodeURI(
      `https://github.com/influxdata/chronograf/issues/new?title=${finalMessage}&body=${template}`
    )

    return (
      <p className="unexpected-error">
        A Chronograf error has occurred. Please report the issue&nbsp;
        <a href={href}>here</a>.
      </p>
    )
  }
}

export function ErrorHandlingWith(
  Error: ErrorComponentClass, // Must be a class based component and not an FunctionComponent
  alwaysDisplay = false
) {
  return <P, S, T extends new (...args: any[]) => Component<P, S>>(base: T) => {
    return class extends base {
      public static get displayName(): string {
        return base.name
      }

      private error: boolean = false
      private err: Error = null

      public componentDidCatch(err, info) {
        console.error(err)
        console.warn(info)
        this.error = true
        this.err = err
        this.forceUpdate()
      }

      public render() {
        if (this.error || alwaysDisplay) {
          return <Error error={this.err} />
        }

        return super.render()
      }
    }
  }
}

export const ErrorHandling = ErrorHandlingWith(DefaultError)
