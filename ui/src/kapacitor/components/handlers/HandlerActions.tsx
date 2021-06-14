import React, {FC} from 'react'

const HandlerActions: FC<{
  onGoToConfig: () => void
  onTest: () => void
  validationError: string
}> = ({onGoToConfig, onTest, validationError}) => (
  <>
    <div
      className="btn btn-primary"
      onClick={e => {
        e.preventDefault()
        onTest()
      }}
    >
      <span className="icon pulse-c" />
      Send Test Alert
    </div>
    <div className="btn btn-default btn-sm" onClick={onGoToConfig}>
      <span className="icon cog-thick" />
      {validationError
        ? 'Exit this Rule and Edit Configuration'
        : 'Save this Rule and Edit Configuration'}
    </div>
  </>
)
export default HandlerActions
