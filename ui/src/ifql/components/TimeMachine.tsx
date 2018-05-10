import React, {PureComponent} from 'react'
import SchemaExplorer from 'src/ifql/components/SchemaExplorer'
import BodyBuilder from 'src/ifql/components/BodyBuilder'
import TimeMachineEditor from 'src/ifql/components/TimeMachineEditor'
import TimeMachineVis from 'src/ifql/components/TimeMachineVis'
import Threesizer from 'src/shared/components/Threesizer'
import {Suggestion, OnChangeScript, FlatBody} from 'src/types/ifql'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {HANDLE_VERTICAL, HANDLE_HORIZONTAL} from 'src/shared/constants/index'

interface Props {
  script: string
  suggestions: Suggestion[]
  body: Body[]
  onChangeScript: OnChangeScript
}

interface Body extends FlatBody {
  id: string
  source: string
}

@ErrorHandling
class TimeMachine extends PureComponent<Props> {
  public render() {
    return (
      <Threesizer
        orientation={HANDLE_HORIZONTAL}
        divisions={this.mainSplit}
        containerClass="page-contents"
      />
    )
  }

  private get mainSplit() {
    const {body} = this.props
    const queryNames = body.length ? body.map(q => q.declarations[0].name) : []

    return [
      {
        handleDisplay: 'none',
        render: () => (
          <Threesizer
            divisions={this.divisions}
            orientation={HANDLE_VERTICAL}
          />
        ),
      },
      {
        handlePixels: 8,
        render: () => <TimeMachineVis tabs={queryNames} />,
      },
    ]
  }

  private get divisions() {
    const {body, suggestions, script, onChangeScript} = this.props
    return [
      {
        name: 'Script',
        render: () => (
          <TimeMachineEditor script={script} onChangeScript={onChangeScript} />
        ),
      },
      {
        name: 'Build',
        render: () => <BodyBuilder body={body} suggestions={suggestions} />,
      },
      {
        name: 'Explore',
        render: () => <SchemaExplorer />,
      },
    ]
  }
}

export default TimeMachine
