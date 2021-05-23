import React from 'react'
import PropTypes from 'prop-types'
import HandlerInput from 'src/kapacitor/components/HandlerInput'
import HandlerEmpty from 'src/kapacitor/components/HandlerEmpty'
const ZenossHandler = ({
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
            fieldName="action"
            fieldDisplay="Action:"
            placeholder="ex: MyRouter"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="method"
            fieldDisplay="Method:"
            placeholder="ex: RouterMethod"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="_type" // type is used by js internally
            fieldDisplay="Event Type:"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="tid" // type is used by js internally
            type="number"
            fieldDisplay="Event TID:"
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
            fieldName="device" // type is used by js internally
            fieldDisplay="Device:"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="component"
            fieldDisplay="Component:"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="evclasskey"
            fieldDisplay="Event Class Key:"
            fieldColumns="col-md-12"
          />
          <HandlerInput
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            fieldName="evclass"
            fieldDisplay="Event Class:"
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

ZenossHandler.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
  onGoToConfig: func.isRequired,
  validationError: string.isRequired,
}

export default ZenossHandler
