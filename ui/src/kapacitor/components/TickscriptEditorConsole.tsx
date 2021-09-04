import React, {FunctionComponent} from 'react'
import {Task} from 'src/types'

interface Props {
  consoleMessage: string
  unsavedChanges: boolean
  task: Task
}

const TickscriptEditorConsole: FunctionComponent<Props> = ({
  consoleMessage,
  unsavedChanges,
  task,
}) => {
  let consoleOutput = 'TICKscript is valid'
  let consoleClass = 'tickscript-console--valid'

  if (consoleMessage) {
    consoleOutput = consoleMessage
    consoleClass = 'tickscript-console--error'
  } else if (unsavedChanges) {
    consoleOutput = 'You have unsaved changes, save to validate TICKscript'
    consoleClass = 'tickscript-console--default'
  }

  return (
    <div className="tickscript-console">
      {task.templateID ? (
        <p className={consoleClass}>
          TickScript is READ-ONLY, it was created from template{' '}
          {task.templateID}.
        </p>
      ) : (
        <p className={consoleClass}>{consoleOutput}</p>
      )}
      {task.vars && Object.keys(task.vars).length ? (
        <p>
          Variables:{' '}
          {Object.keys(task.vars).map(name => (
            <span key={name}>
              {name}:{task.vars[name].type}={String(task.vars[name].value)}{' '}
            </span>
          ))}
        </p>
      ) : undefined}
    </div>
  )
}

export default TickscriptEditorConsole
