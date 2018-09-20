// Libraries
import React, {SFC} from 'react'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'

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

interface Body extends FlatBody {
  id: string
}

const FluxQueryBuilder: SFC<Props> = props => {
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
  } = props

  return (
    <div className="time-machine--modes">
      <div className="time-machine--mode">Script</div>
      <div className="time-machine--mode-panel">
        <TimeMachineEditor
          status={status}
          script={script}
          suggestions={suggestions}
          onChangeScript={onChangeScript}
          onSubmitScript={onSubmitScript}
        />
      </div>
      <div className="time-machine--mode">Build</div>
      <div className="time-machine--mode-panel">
        <BodyBuilder
          body={body}
          service={service}
          suggestions={suggestions}
          onDeleteBody={onDeleteBody}
          onAppendFrom={onAppendFrom}
          onAppendJoin={onAppendJoin}
        />
      </div>
      <div className="time-machine--mode">Schema</div>
      <div className="time-machine--mode-panel">
        <SchemaExplorer service={service} notify={notify} />
      </div>
    </div>
  )
}

export default FluxQueryBuilder
