import React, {FC} from 'react'

const HandlerActions: FC<{
  onGoToConfig: () => void
  onTest: () => void
  validationError: string
}> = ({onGoToConfig, onTest, validationError}) => (
  <div style={{display: 'flex'}}>
    <div
      className="btn btn-primary btn-sm"
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
  </div>
)
export default HandlerActions
