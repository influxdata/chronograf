import React from 'react'
import PropTypes from 'prop-types'
import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'
import HandlerActions from './HandlerActions'

const OpsgenieHandler = ({
  selectedHandler,
  handleModifyHandler,
  onGoToConfig,
  onTest,
  validationError,
}) =>
  selectedHandler.enabled ? (
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
        <div className="faux-form">
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="api-key"
            fieldDisplay="API-key"
            placeholder=""
            redacted={true}
            disabled={true}
            fieldColumns="col-md-12"
          />
        </div>
      </div>
      <div className="endpoint-tab--parameters">
        <h4>Parameters for this Alert Handler:</h4>
        <div className="faux-form">
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="teams"
            fieldDisplay="Teams"
            placeholder="ex: teams_name"
            parseToArray={true}
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="recipients"
            fieldDisplay="Recipients"
            placeholder="ex: recipients_name"
            parseToArray={true}
          />
        </div>
      </div>
    </div>
  ) : (
    <HandlerEmpty
      onGoToConfig={onGoToConfig}
      validationError={validationError}
    />
  )

const {func, shape, string} = PropTypes

OpsgenieHandler.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
  onGoToConfig: func.isRequired,
  validationError: string.isRequired,
}

export default OpsgenieHandler
