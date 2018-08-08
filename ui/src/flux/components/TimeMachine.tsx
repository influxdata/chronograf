import React, {SFC} from 'react'

import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineVis from 'src/flux/components/TimeMachineVis'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

import {HANDLE_VERTICAL, HANDLE_HORIZONTAL} from 'src/shared/constants'

import {
  Suggestion,
  OnChangeScript,
  OnSubmitScript,
  OnDeleteBody,
  FlatBody,
  ScriptStatus,
} from 'src/types/flux'
import {Service} from 'src/types'

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

  const verticalDivisions = [
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

  const horizontalDivisions = [
    {
      name: '',
      handleDisplay: 'none',
      headerButtons: [],
      menuOptions: [],
      render: () => <TimeMachineVis service={service} script={script} />,
      headerOrientation: HANDLE_HORIZONTAL,
    },
    {
      name: '',
      headerButtons: [],
      menuOptions: [],
      render: () => (
        <Threesizer
          orientation={HANDLE_VERTICAL}
          divisions={verticalDivisions}
        />
      ),
      headerOrientation: HANDLE_HORIZONTAL,
    },
  ]

  return (
    <Threesizer
      orientation={HANDLE_HORIZONTAL}
      divisions={horizontalDivisions}
      containerClass="page-contents"
    />
  )
}

export default TimeMachine
