import React, {FunctionComponent} from 'react'

import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'
import HandlerActions from './HandlerActions'

interface Handler {
  alias: string
  enabled: boolean
  headerKey: string
  headerValue: string
  headers: {
    [key: string]: string
  }
  text: string
  type: string
  url: string
  id: number
}

interface Props {
  selectedHandler: Handler
  handleModifyHandler: (
    selectedHandler: Handler,
    fieldName: string,
    parseToArray: boolean,
    headerIndex: number
  ) => void
  onGoToConfig: () => void
  onTest: (handler: Record<string, unknown>) => void
  validationError: string
}

const KafkaHandler: FunctionComponent<Props> = ({
  selectedHandler,
  handleModifyHandler,
  onGoToConfig,
  onTest,
  validationError,
}) => {
  const handler = {...selectedHandler, cluster: selectedHandler.id}
  handleModifyHandler(handler, 'cluster', false, 0)

  if (selectedHandler.enabled) {
    return (
      <div className="endpoint-tab-contents">
        <div className="endpoint-tab--parameters">
          <h4 className="u-flex u-jc-space-between">
            Parameters for this Alert Handler
            <HandlerActions
              onGoToConfig={onGoToConfig}
              onTest={() => onTest(handler)}
              validationError={validationError}
            />
          </h4>
          <div className="faux-form">
            <HandlerInput
              selectedHandler={handler}
              handleModifyHandler={handleModifyHandler}
              fieldName="kafka-topic"
              fieldDisplay="Topic"
              placeholder=""
            />
            <HandlerInput
              selectedHandler={handler}
              handleModifyHandler={handleModifyHandler}
              fieldName="template"
              fieldDisplay="Template"
              placeholder=""
            />
          </div>
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

export default KafkaHandler
