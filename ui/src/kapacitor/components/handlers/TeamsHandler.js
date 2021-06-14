import React from 'react'
import PropTypes from 'prop-types'
import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'
import HandlerActions from './HandlerActions'

const TeamsHandler = ({
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
          Parameter Overriding Kapacitor Configuration
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
            fieldName="channel-url"
            fieldDisplay="Channel URL:"
            placeholder="ex: https://outlook.office.com/webhook/..."
            fieldColumns="col-md-12"
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

TeamsHandler.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
  onGoToConfig: func.isRequired,
  validationError: string.isRequired,
}

export default TeamsHandler
