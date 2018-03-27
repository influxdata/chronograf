import React from 'react'
import PropTypes from 'prop-types'
import ModelHeaderSave from 'src/loudml/components/ModelHeaderSave'

const ModelHeader = ({
    name,
    onSave,
    validationError
}) => {
    return (
        <div className="panel-heading">
            <h2 className="panel-title">
                {name}
            </h2>
            <div className="panel-controls">
                <ModelHeaderSave
                    name={name}
                    onSave={onSave}
                    validationError={validationError}
                />
            </div>
        </div>
    )
}

ModelHeader.propTypes = {
    name: PropTypes.string,
    onSave: PropTypes.func.isRequired,
    validationError: PropTypes.string,
}

export default ModelHeader
