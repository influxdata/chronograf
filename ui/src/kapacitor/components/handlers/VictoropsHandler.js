import React from 'react'
import PropTypes from 'prop-types'
import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'

const VictoropsHandler = ({
  selectedHandler,
  handleModifyHandler,
  onGoToConfig,
  validationError,
}) =>
  selectedHandler.enabled ? (
    <div className="endpoint-tab-contents">
      <div className="endpoint-tab--parameters">
        <h4 className="u-flex u-jc-space-between">
          Parameters from Kapacitor Configuration
          <div className="btn btn-default btn-sm" onClick={onGoToConfig}>
            <span className="icon cog-thick" />
            {validationError
              ? 'Exit this Rule and Edit Configuration'
              : 'Save this Rule and Edit Configuration'}
          </div>
        </h4>
        <div className="faux-form">
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="api-key"
            fieldDisplay="API key"
            placeholder="ex: api_key"
            disabled={true}
            redacted={true}
            fieldColumns="col-md-12"
          />
        </div>
      </div>
      <div className="endpoint-tab--parameters">
        <h4>Parameters for this Alert Handler</h4>
        <div className="faux-form">
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="routingKey"
            fieldDisplay="Routing Key:"
            placeholder="ex: routing_key"
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

VictoropsHandler.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
  onGoToConfig: func.isRequired,
  validationError: string.isRequired,
}

export default VictoropsHandler
