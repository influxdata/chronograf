import React from 'react'
import PropTypes from 'prop-types'

const HandlerCheckbox = ({
  fieldName,
  fieldDisplay,
  selectedHandler,
  handleModifyHandler,
}) => (
  <div className="form-group ">
    <div className="form-control-static handler-checkbox">
      <input
        name={fieldName}
        id={fieldName}
        type="checkbox"
        defaultChecked={selectedHandler[fieldName]}
        onClick={handleModifyHandler(selectedHandler, fieldName)}
      />
      <label htmlFor={fieldName}>{fieldDisplay}</label>
    </div>
  </div>
)

const {func, shape, string, bool} = PropTypes

HandlerCheckbox.propTypes = {
  fieldName: string,
  fieldDisplay: string,
  defaultChecked: bool,
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
}

export default HandlerCheckbox
