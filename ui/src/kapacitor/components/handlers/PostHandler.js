import React from 'react'
import PropTypes from 'prop-types'
import HandlerInput from 'src/kapacitor/components/HandlerInput'

const PostHandler = ({selectedHandler, handleModifyHandler}) => (
  <div className="endpoint-tab-contents">
    <div className="endpoint-tab--parameters">
      <h4>Parameters for this Alert Handler</h4>
      <div className="faux-form">
        <HandlerInput
          selectedHandler={selectedHandler}
          handleModifyHandler={handleModifyHandler}
          fieldName="url"
          fieldDisplay="HTTP endpoint for POST request"
          placeholder="ex: http://example.com/api/alert"
          fieldColumns="col-md-12"
        />
        <HandlerInput
          selectedHandler={selectedHandler}
          handleModifyHandler={handleModifyHandler}
          fieldName="headerKey"
          fieldDisplay="Header Key"
          placeholder=""
        />
        <HandlerInput
          selectedHandler={selectedHandler}
          handleModifyHandler={handleModifyHandler}
          fieldName="headerValue"
          fieldDisplay="Header Value"
          placeholder=""
        />
      </div>
    </div>
  </div>
)

const {func, shape} = PropTypes

PostHandler.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
}

export default PostHandler
