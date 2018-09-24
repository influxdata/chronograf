// Libraries
import React, {PureComponent} from 'react'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'

// Types
import {
  Suggestion,
  OnChangeScript,
  OnSubmitScript,
  OnDeleteBody,
  FlatBody,
  ScriptStatus,
} from 'src/types/flux'
import {Service, NotificationAction} from 'src/types'

interface Props {
  body: Body[]
  script: string
  service: Service
  status: ScriptStatus
  suggestions: Suggestion[]
  onDeleteBody: OnDeleteBody
  notify: NotificationAction
  onChangeScript: OnChangeScript
  onSubmitScript: OnSubmitScript
  onAppendFrom: () => void
  onAppendJoin: () => void
  onValidate: () => void
}

interface State {
  wasFuncSelectorClicked: boolean
}

interface Body extends FlatBody {
  id: string
}

class FluxQueryBuilder extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      wasFuncSelectorClicked: false,
    }
  }

  public render() {
    return (
      <Threesizer
        orientation={HANDLE_VERTICAL}
        divisions={this.verticalDivisions}
        containerClass="page-contents"
      />
    )
  }

  private get verticalDivisions() {
    const {
      body,
      notify,
      service,
      suggestions,
      onAppendFrom,
      onDeleteBody,
      onAppendJoin,
      script,
      status,
      onValidate,
      onChangeScript,
      onSubmitScript,
    } = this.props

    return [
      {
        name: 'Script',
        headerOrientation: HANDLE_VERTICAL,
        headerButtons: [
          <div
            key="validate"
            className="btn btn-default btn-xs validate--button"
            onClick={onValidate}
          >
            Validate
          </div>,
        ],
        menuOptions: [],
        render: visibility => (
          <TimeMachineEditor
            setWasFuncSelectorClicked={this.setWasFuncSelectorClicked}
            status={status}
            script={script}
            visibility={visibility}
            suggestions={suggestions}
            onChangeScript={onChangeScript}
            onSubmitScript={onSubmitScript}
          />
        ),
      },
      {
        name: 'Build',
        headerButtons: [],
        menuOptions: [],
        render: () => (
          <BodyBuilder
            body={body}
            wasFuncSelectorClicked={this.state.wasFuncSelectorClicked}
            setWasFuncSelectorClicked={this.setWasFuncSelectorClicked}
            suggestions={suggestions}
            onDeleteBody={onDeleteBody}
            onAppendFrom={onAppendFrom}
            onAppendJoin={onAppendJoin}
          />
        ),
      },
      {
        name: 'Explore',
        headerButtons: [],
        menuOptions: [],
        render: () => <SchemaExplorer service={service} notify={notify} />,
        headerOrientation: HANDLE_VERTICAL,
      },
    ]
  }

  private setWasFuncSelectorClicked = (val: boolean) => {
    this.setState({wasFuncSelectorClicked: val})
  }
}

export default FluxQueryBuilder
