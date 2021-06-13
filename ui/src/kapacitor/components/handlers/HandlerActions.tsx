import React, {FC} from 'react'

const HandlerActions: FC<{
  onGoToConfig: () => void
  validationError: string
}> = ({onGoToConfig, validationError}) => (
  <div className="btn btn-default btn-sm" onClick={onGoToConfig}>
    <span className="icon cog-thick" />
    {validationError
      ? 'Exit this Rule and Edit Configuration'
      : 'Save this Rule and Edit Configuration'}
  </div>
)
export default HandlerActions
