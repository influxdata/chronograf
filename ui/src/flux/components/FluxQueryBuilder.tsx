// Libraries
import React, {SFC} from 'react'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'

// Types
import {
  Context,
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
  context: Context
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

interface Body extends FlatBody {
  id: string
}

const FluxQueryBuilder: SFC<Props> = props => {
  const {
    body,
    notify,
    service,
    context,
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
          context={context}
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
      render: () => <SchemaExplorer service={service} notify={notify} />,
      headerOrientation: HANDLE_VERTICAL,
    },
  ]

  return (
    <Threesizer
      orientation={HANDLE_VERTICAL}
      divisions={verticalDivisions}
      containerClass="page-contents"
    />
  )
}

export default FluxQueryBuilder
