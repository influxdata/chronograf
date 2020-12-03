import React, {FunctionComponent} from 'react'

interface Props {
  consoleMessage: string
  unsavedChanges: boolean
}

const TickscriptEditorConsole: FunctionComponent<Props> = ({
  consoleMessage,
  unsavedChanges,
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
      <p className={consoleClass}>{consoleOutput}</p>
    </div>
  )
}

export default TickscriptEditorConsole
