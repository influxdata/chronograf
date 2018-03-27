import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {notify as notifyAction} from 'shared/actions/notifications'

import Feature from 'src/loudml/components/Feature'

import {showMeasurements} from 'src/shared/apis/metaQuery'
import showMeasurementsParser from 'src/shared/parsing/showMeasurements'
import { findSource } from 'src/loudml/utils/datasource';

import {TEN_SECONDS} from 'shared/constants/index'
import {DEFAULT_FEATURE} from 'src/loudml/constants'

const defaultErrorNotification = {
    type: 'error',
    icon: 'alert-triangle',
    duration: TEN_SECONDS,
}

const notifyFeatureNameInvalid = () => ({
    ...defaultErrorNotification,
    message: 'Feature name cannot be blank.',
  })
  
const notifyFeatureNameAlreadyExists = () => ({
    ...defaultErrorNotification,
    message: 'A Feature by this name already exists.',
  })
  
class FeaturesPanel extends Component {
    constructor(props) {
        super(props)

        this.state = {
            measurements: [],
            source: null,
            database: null,
        }
    }

    componentDidMount = () => {
        this.getMeasurements()
    }

    getMeasurements = async () => {
        const {
            sources,
            datasource,
        } = this.props
        
        if (!datasource) {
            return
        }

        try {
            const source = findSource(sources, datasource)
            const {database} = datasource
            const {data} = await showMeasurements(source.links.proxy, database)
            const {measurementSets} = showMeasurementsParser(data)
            const measurements = measurementSets[0].measurements
            this.setState({measurements, source, database})
        } catch (err) {
            console.error(err)
        }
    }

    addFeature = () => {
        const {features} = this.props
        this.onInputChange([
            {...DEFAULT_FEATURE, isEditing: true},
            ...features
        ])
    }

    deleteFeature = toDelete => {
        const {features} = this.props

        this.onInputChange(features.filter(feature => feature !== toDelete))
    }

    editFeature = (toEdit, val) => {
        let {features} = this.props

        features = features.map(
            feature => (feature === toEdit) ? {...toEdit,...val} : feature
        )
        this.onInputChange(features)
    }

    onInputChange = features => {
        const {onInputChange} = this.props

        onInputChange({
            target: {
                name: 'features',
                type: typeof features,
                value: features
            }
        })
    }

    handleConfirmFeature = feature => {
        const {notify, features} = this.props
        
        if (!feature.name) {
            return notify(notifyFeatureNameInvalid())
        }
    
        if (features.find(f => f!==feature && f.name === feature.name) !== undefined) {
            return notify(notifyFeatureNameAlreadyExists())
        }
    
        this.onInputChange(
            features.map(f => (
                f===feature
                    ?delete f.isEditing&&{...f}
                    :{...f})
            )
        )
    }

    handleKeyDownFeature = feature => e => {
        const {key} = e
    
        if (key === 'Escape') {
            this.deleteFeature(feature)
        }
    
        if (key === 'Enter') {
            this.handleConfirmFeature(feature)
        }
    }

    get title() {
        const {features} = this.props

        if (features.length === 0) {
            return ''
        }

        return (features.length === 1
            ? '1 Feature'
            : `${features.length} Features`)
    }

    render() {
        const {features, locked} = this.props
        const {
            measurements,
            source,
            database,
        } = this.state

        return (
            <div className="panel panel-solid">
                {locked
                    ?(<div className="panel-heading">
                        <h6><span className="icon stop" /> This panel is locked
                        </h6></div>)
                    :null}
                <div className="panel-heading">
                    <h2 className="panel-title">
                        {this.title}
                    </h2>
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={!!features.some(f => f.isEditing)
                            ||locked}
                        onClick={this.addFeature}
                    >
                        <span className="icon plus" /> Add feature
                    </button>
                </div>
                <div className="panel-body">
                    {features.length
                        ? features.map((feature, index) => (
                            <Feature
                                key={`${index}_${features.length}`}
                                feature={feature}
                                onDelete={this.deleteFeature}
                                onCancel={this.deleteFeature}
                                onEdit={this.editFeature}
                                onKeyDown={this.handleKeyDownFeature}
                                onConfirm={this.handleConfirmFeature}
                                measurements={measurements}
                                source={source}
                                database={database}
                                locked={locked}
                            />))
                        : <i>No feature</i>}
                </div>
            </div>
        )
    }
}

const {arrayOf, func, shape, bool} = PropTypes

FeaturesPanel.propTypes = {
    features: arrayOf(shape({})),
    onInputChange: func.isRequired,
    notify: func.isRequired,
    source: shape(),
    datasource: shape(),
    sources: arrayOf(shape()),
    locked: bool.isRequired,
}

const mapStateToProps = state => {
    const { sources } = state

    return {
        sources,
    }
}

const mapDispatchToProps = dispatch => ({
    notify: message => dispatch(notifyAction(message))
})

export default connect(mapStateToProps, mapDispatchToProps)(FeaturesPanel)
