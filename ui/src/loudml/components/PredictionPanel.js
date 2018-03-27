import React from 'react'
import PropTypes from 'prop-types'

const PredictionPanel = ({
    model,
    onInputChange,
}) => {
    return (
        <div className="panel panel-solid">
            <div className="panel-heading">
                <h2 className="panel-title">
                </h2>
            </div>
            <div className="panel-body">
                <div className="form-group col-xs-12 col-sm-6">
                    <label htmlFor="span">Interval</label>
                    <input
                        type="text"
                        name="interval"
                        className="form-control input-md form-malachite"
                        value={model.interval}
                        onChange={onInputChange}
                        placeholder="ex: 30s, 5m, 1h, 1d, ..."
                    />
                </div>
                <div className="form-group col-xs-12 col-sm-6">
                    <label htmlFor="offset">Offset</label>
                    <input
                        type="text"
                        name="offset"
                        className="form-control input-md form-malachite"
                        value={model.offset}
                        onChange={onInputChange}
                        placeholder="ex: 5s, 1m, 1h, 1d, ..."
                    />
                </div>
            </div>
        </div>
    )
}

const {func, shape} = PropTypes

PredictionPanel.propTypes = {
    model: shape({}),
    onInputChange: func.isRequired,
}

export default PredictionPanel
