import React, {PureComponent} from 'react'

interface Props {
  message?: string
}

class InvalidData extends PureComponent<Props> {
  public render() {
    return <div className="graph-empty">{this.errorMessage}</div>
  }

  private get errorMessage(): JSX.Element {
    if (this.props.message) {
      return <p>{this.props.message}</p>
    }

    return (
      <p>
        The data returned from the query can't be visualized with this graph
        type.<br />Try updating the query or selecting a different graph type.
      </p>
    )
  }
}

export default InvalidData
