import React, {SFC} from 'react'
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import {
  Suggestion,
  OnChangeScript,
  OnSubmitScript,
  OnDeleteBody,
  FlatBody,
  ScriptStatus,
} from 'src/types/flux'

import {Service} from 'src/types'
import {HANDLE_VERTICAL} from 'src/shared/constants'

interface Props {
  service: Service
  script: string
  body: Body[]
  status: ScriptStatus
  suggestions: Suggestion[]
  onChangeScript: OnChangeScript
  onDeleteBody: OnDeleteBody
  onSubmitScript: OnSubmitScript
  onAppendFrom: () => void
  onAppendJoin: () => void
  onValidate: () => void
}

interface Body extends FlatBody {
  id: string
}

const TimeMachine: SFC<Props> = props => {
  const {
    body,
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
  } = props

  const divisions = [
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
      size: 0.67,
      render: () => (
        <BodyBuilder
          body={body}
          service={service}
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
      render: () => <SchemaExplorer service={service} />,
      headerOrientation: HANDLE_VERTICAL,
    },
  ]

  return (
    <Threesizer
      orientation={HANDLE_VERTICAL}
      divisions={divisions}
      containerClass="page-contents"
    />
  )
}

export default TimeMachine
