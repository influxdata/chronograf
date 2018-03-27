import React from 'react'
import {PropTypes} from 'prop-types'

const AnomalyPanel = ({
    model,
    annotation,
    onInputChange,
    onAnnotationChange,
}) => {
    /*
    function handleAnomaly(e) {
        const {name, id, checked} = e.target
    
        onInputChange({
            target: {
                name,
                type: 'custom',
                value : {
                    ...model.seasonality,
                    [id]: checked,
                }
            }
        })
    }
    */

    return (
        <div className="panel panel-solid">
            <div className="panel-heading">
                <h2 className="panel-title"></h2>
            </div>
            <div className="panel-body">
                <div className="form-group col-xs-12 col-sm-6">
                    <label htmlFor="min_threshold">Min threshold</label>
                    <input
                        type="number"
                        name="min_threshold"
                        className="form-control input-md form-malachite"
                        value={model.min_threshold}
                        onChange={onInputChange}
                        placeholder="ex: 100"
                        step='0.1'
                    />
                </div>
                <div className="form-group col-xs-12 col-sm-6">
                    <label htmlFor="max_threshold">Max threshold</label>
                    <input
                        type="number"
                        name="max_threshold"
                        className="form-control input-md form-malachite"
                        value={model.max_threshold}
                        onChange={onInputChange}
                        placeholder="ex: 100"
                        step='0.1'
                    />
                </div>
                <div className="form-group col-xs-12 col-sm-6">
                    <div className="form-control-static">
                        <div className="col-xs-12">
                            <input
                            type="checkbox"
                            id="add_annotation"
                            name="annotation"
                            checked={annotation}
                            onChange={onAnnotationChange}
                                />
                            <label htmlFor="add_annotation">Add annotations</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const {func, shape, bool} = PropTypes

AnomalyPanel.propTypes = {
    model: shape({}),
    annotation: bool.isRequired,
    onInputChange: func.isRequired,
    onAnnotationChange: func.isRequired,
}

export default AnomalyPanel
