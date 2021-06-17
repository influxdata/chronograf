import React, {FunctionComponent} from 'react'
import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'
import HandlerActions from './HandlerActions'

interface Props {
  selectedHandler: {
    enabled: boolean
  }
  handleModifyHandler: () => void
  onGoToConfig: () => void
  onTest: (handler: Record<string, unknown>) => void
  validationError: string
}

const Pagerduty2Handler: FunctionComponent<Props> = ({
  selectedHandler,
  handleModifyHandler,
  onGoToConfig,
  onTest,
  validationError,
}) => {
  if (selectedHandler.enabled) {
    return (
      <div className="endpoint-tab-contents">
        <div className="endpoint-tab--parameters">
          <h4 className="u-flex u-jc-space-between">
            Parameters from Kapacitor Configuration
            <HandlerActions
              onGoToConfig={onGoToConfig}
              onTest={() => onTest(selectedHandler)}
              validationError={validationError}
            />
          </h4>
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="routingKey"
            fieldDisplay="Routing Key:"
            placeholder="ex: routing_key"
            redacted={true}
            fieldColumns="col-md-12"
          />
        </div>
      </div>
    )
  }

  return (
    <HandlerEmpty
      onGoToConfig={onGoToConfig}
      validationError={validationError}
    />
  )
}

export default Pagerduty2Handler
