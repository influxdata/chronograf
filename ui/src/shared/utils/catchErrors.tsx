import React, {Component} from 'react'

import {GIT_SHA} from 'src/shared/constants'

export const catchErrors = <P extends object>(
  InnerComponent: React.ComponentType<P>
) => {
  class ErrorHandling extends Component<P> {
    private error?

    public componentDidCatch(error, info) {
      console.error(error)
      console.warn(info)

      this.error = error
      this.forceUpdate()
    }

    public render() {
      if (!this.error) {
        return <InnerComponent {...this.props} />
      }

      const {stack, message} = this.error
      const title = ` Chronograf (${GIT_SHA.slice(0, 6)}) ${message}`
      const href = `https://github.com/influxdata/chronograf/issues/new?title=${title}&body=\`\`\`${stack}\`\`\``

      return (
        <p className="unexpected-error">
          A Chronograf error has occurred. Please report the issue&nbsp;
          <a href={href}>here</a>.
        </p>
      )
    }
  }

  return ErrorHandling
}
