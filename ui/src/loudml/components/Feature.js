import React, {Component} from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import FancyScrollbar from 'shared/components/FancyScrollbar';
import Dropdown from 'shared/components/Dropdown'

import FeatureHeader from 'src/loudml/components/FeatureHeader'
import FillFeature from 'src/loudml/components/FillFeature'
import FeatureTags from 'src/loudml/components/FeatureTags'

import {showFieldKeys} from 'src/shared/apis/metaQuery'
import showFieldKeysParser from 'shared/parsing/showFieldKeys'

import {
    normalizeFeatureDefault,
    denormalizeFeatureDefault,
} from 'src/loudml/utils/model';

import {DEFAULT_METRICS, DEFAULT_IO, DEFAULT_LOUDML_RP} from 'src/loudml/constants'
import {DEFAULT_ANOMALY_TYPE} from 'src/loudml/constants/anomaly'

import 'src/loudml/styles/feature.scss'

class Feature extends Component {
    constructor(props) {
        super(props)

        this.state = {
            fields: []
        }
    }

    componentDidMount = () => {
        this.getFields()
    }

    componentDidUpdate(prevProps) {
        const {
            source,
            database,
            measurements,
            feature: {measurement},
        } = this.props

        if (
            _.isEqual(source, prevProps.source)
            && database === prevProps.database
            && _.isEqual(measurements, prevProps.measurements)
            && measurement === prevProps.feature.measurement
        ) {
            return
        }
        this.getFields();
    }

    getFields = async () => {
        const {
            source,
            database,
            feature: {measurement},
            measurements,
        } = this.props

        if (
            !source
            ||!database
            ||measurements.length===0
            ||!measurement) {
            return
        }

        try {
            const {data} = await showFieldKeys(source.links.proxy, database, measurement, DEFAULT_LOUDML_RP)
            const {errors, fieldSets} = showFieldKeysParser(data)
            if (errors.length) {
                console.error('Error parsing fields keys: ', errors)
                return
            }
            this.setState({
                fields: fieldSets[measurement]||[],
            })
        } catch (err) {
            console.error(err)
        }
    }

    handleTextChoose = key => item => {
        const {feature, onEdit} = this.props

        onEdit(feature, {[key]: item.text})
    }

    handleValueChoose = key => item => {
        const {feature, onEdit} = this.props

        onEdit(feature, {[key]: item.value})
    }

    handleFillChoose = item => {
        const {feature, onEdit} = this.props

        onEdit(feature, {default: normalizeFeatureDefault(item)})
    }

    handleMeasurementChoose = item => {
        const {feature, onEdit} = this.props

        onEdit(feature, {
            measurement: item.text,
            field: null,
            match_all: [],
        })
    }

    handleEditFeature = f => {
        const {onEdit} = this.props

        return function (e) {
            onEdit(f, {name: e.target.value})
        }
    }

    onChooseTag = ({key, value}) => {
        const {feature, onEdit} = this.props

        const shouldRemoveTag = feature.match_all.some(m => (m.tag === key && m.value === value))

        if (shouldRemoveTag) {
            // toggle tag
            return onEdit(feature, { match_all: feature.match_all.filter(m => (m.tag !== key))})
        }

        // Transform match_all Array to Object
        // and override new key
        const matchAll = {
            ...feature.match_all.reduce(
                (a, m) => ({
                    ...a,
                    [m.tag]: m.value,
                }), {}),
            [key]: value,
        }

        onEdit(feature, {
            match_all: Object.entries(matchAll)
                .map(([tagKey, tagValue]) => ({
                    tag: tagKey,
                    value: tagValue,
                }))
        })
    }

    get tagLabel() {
        const {feature} = this.props

        if (feature.match_all.length===0) {
            return 'No tags selected'
        }

        return (feature.match_all.length === 1
            ? '1 tag selected'
            : `${feature.match_all.length} tags selected`)
    }

    render() {
        const {
            onDelete,
            onKeyDown,
            onConfirm,
            measurements,
            feature,
            database,
            source,
            locked,
        } = this.props

        const {
            fields,
        } = this.state

        return(
            <div className="db-manager">
                <FeatureHeader
                    feature={feature}
                    onDelete={onDelete}
                    onEdit={this.handleEditFeature}
                    onKeyDown={onKeyDown}
                    onCancel={onDelete}
                    onConfirm={onConfirm}
                    disabled={locked}
                    />
                <div className="feature-body">
                    <div className="feature-row">
                        <div className="feature-column">
                            <div className="feature-row">
                                <div className="form-group col-xs-4">
                                    <label htmlFor="measurement">Measurement</label>
                                </div>
                                <div className="form-group col-xs-8">
                                    <Dropdown
                                        name="measurement"
                                        onChoose={this.handleMeasurementChoose}
                                        items={measurements.map(m => ({text: m}))}
                                        selected={measurements.find(m => m === feature.measurement)||''}
                                        className="dropdown-stretch"
                                        buttonSize="btn-sm"
                                        disabled={locked}
                                        />
                                </div>
                            </div>
                            <div className="feature-row">
                                <div className="form-group col-xs-4">
                                    <label htmlFor="field">Field</label>
                                </div>
                                <div className="form-group col-xs-8">
                                    <Dropdown
                                        name="field"
                                        onChoose={this.handleTextChoose('field')}
                                        items={fields.map(f => ({text: f}))}
                                        selected={fields.find(f => f === feature.field)||''}
                                        className="dropdown-stretch"
                                        buttonSize="btn-sm"
                                        disabled={locked}
                                        />
                                </div>
                            </div>
                            <div className="feature-row">
                                <div className="form-group col-xs-4">
                                    <label htmlFor="metric">Metric</label>
                                </div>
                                <div className="form-group col-xs-8">
                                    <Dropdown
                                        name="metric"
                                        onChoose={this.handleTextChoose('metric')}
                                        items={DEFAULT_METRICS.map(m => ({text: m}))}
                                        selected={feature.metric}
                                        className="dropdown-stretch"
                                        buttonSize="btn-sm"
                                        disabled={locked}
                                        />
                                </div>
                            </div>
                            <div className="feature-row">
                                    <div className="form-group col-xs-4">
                                        <label>Default</label>
                                    </div>
                                    <div className="form-group col-xs-8">
                                        <FillFeature
                                            value={denormalizeFeatureDefault(feature.default)}
                                            onChooseFill={this.handleFillChoose}
                                            theme="GREEN"
                                            size="sm"
                                            disabled={locked}
                                            />
                                    </div>
                            </div>
                            <div className="feature-row">
                                <div className="form-group col-xs-4">
                                    <label htmlFor="io">Input/Output</label>
                                </div>
                                <div className="form-group col-xs-8">
                                    <Dropdown
                                        name="io"
                                        onChoose={this.handleValueChoose('io')}
                                        items={DEFAULT_IO}
                                        selected={DEFAULT_IO.find(i => i.value === feature.io).text}
                                        className="dropdown-stretch"
                                        buttonSize="btn-sm"
                                        disabled={locked}
                                        />
                                </div>
                            </div>
                            <div className="feature-row">
                                <div className="form-group col-xs-4">
                                    <label htmlFor="anomaly_type">Anomaly type</label>
                                </div>
                                <div className="form-group col-xs-8">
                                    <Dropdown
                                        name="anomaly_type"
                                        onChoose={this.handleValueChoose('anomaly_type')}
                                        items={DEFAULT_ANOMALY_TYPE}
                                        selected={DEFAULT_ANOMALY_TYPE.find(a => a.value === feature.anomaly_type).text}
                                        className="dropdown-stretch"
                                        buttonSize="btn-sm"
                                        disabled={locked}
                                        />
                                </div>
                            </div>
                        </div>
                        <div className="feature-column feature-column-tags">
                            <div className="feature-column-tags--header">
                                <span>{this.tagLabel}</span>
                            </div>
                            <div className="feature-column feature-column-tags--content">
                                <FancyScrollbar>
                                    <FeatureTags
                                        tags={feature.match_all}
                                        database={database}
                                        measurement={feature.measurement}
                                        retentionPolicy={DEFAULT_LOUDML_RP}
                                        source={source}
                                        onChooseTag={this.onChooseTag}
                                        disabled={locked}
                                        />
                                </FancyScrollbar>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

const {func, shape, arrayOf, string, bool} = PropTypes

Feature.propTypes = {
    feature: shape({}).isRequired,
    onDelete: func.isRequired,
    onEdit: func.isRequired,
    onKeyDown: func.isRequired,
    onConfirm: func.isRequired,
    measurements: arrayOf(string),
    source: shape(),
    database: string,
    locked: bool.isRequired,
}

export default Feature
