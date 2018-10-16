import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import uuid from 'uuid'
import classnames from 'classnames'

import ReactTooltip from 'react-tooltip'

import {notify as notifyAction} from 'shared/actions/notifications'

import {convertTimeRange} from 'src/loudml/utils/timerange'
import {parseError} from 'src/loudml/utils/error'
import {createHook} from 'src/loudml/utils/hook'
import {
    normalizeInterval,
    normalizeFeatureDefault,
} from 'src/loudml/utils/model'
import {
    createModel,
    trainAndStartModel,
    getDatasources,
    createModelHook,
} from 'src/loudml/apis'

import {
    modelCreated as modelCreatedAction,
    jobStart as jobStartAction,
} from "src/loudml/actions/view"

import {
    notifyModelCreated,
    notifyModelCreationFailed,
    notifyModelTraining,
    notifyModelTrainingFailed,
} from 'src/loudml/actions/notifications'

import {DEFAULT_MODEL} from 'src/loudml/constants'
import {ANOMALY_HOOK} from 'src/loudml/constants/anomaly'

const UNDEFINED_DATASOURCE = 'Unable to find LoudML datasource for selected database. Check configuration'
const SELECT_FEATURE = 'Select one field'
const SELECT_BUCKET_INTERVAL = 'Select a \'Group by\' value'
const SELECT_ONLY_ONE_TAG_VALUE = 'Select only one value per tag'
const LINEAR_NOTSUPPORTED = 'Linear mode not supported'

const formatNotification = s => {
    return `<code>${s}</code>`
}
const notifyDatasource = datasource => {
    datasource = (datasource&&formatNotification(datasource))||UNDEFINED_DATASOURCE
    return `<h1>Loud ML Datasource:</h1><p>${datasource}</p>`
}

const notifyFeature = fields => {
    const feature = (
        (
            fields
            &&fields.length===1
            &&formatNotification(`${fields[0].value}(${fields[0].args[0].value})`)
        )
    )||SELECT_FEATURE
    return `<h1>Feature:</h1><p>${feature}</p>`
}

const notifyInterval = time => {
    const interval = (
            time!==null
            &&time!=='auto'
            &&formatNotification(time)
    )||SELECT_BUCKET_INTERVAL
    return `<h1>groupBy bucket interval:</h1><p>${interval}</p>`
}

const notifyMatch = tags => {
    const entries = Object.entries(tags)

    if (entries.some(e => e[1].length>1)) {
        // tag selected on multiple values
        return `<h1>Match all:</h1><p>${SELECT_ONLY_ONE_TAG_VALUE}</p>`
    }

    if (entries.length>0) {
        const matches = entries
            .map(e => {
                const [tag, values] = e
                return formatNotification(`${tag}:${values[0]}`)
                }).join('')
        return `<h1>Match all:</h1><p>${matches}</p>`
    }

    return ''
}

const notifyFillValue = fill => {
    fill = (
        fill==='linear'
        ?LINEAR_NOTSUPPORTED
        :formatNotification(fill==='none'?null:fill)
    )
    return `<h1>Fill value:</h1><p>${fill}</p>`
}

const notifyTagsAccepted = areTagsAccepted => {
    if (areTagsAccepted===false) {
        return '<h1>Tags:</h1><p>Tags must be set to \'equal to\'</p>'
    }

    return ''
}

const checkTags = (tags) => {
    // really length > 1. Can we have zero length?
    return Object.values(tags).some(v => v.length>1) === false
}

class OneClickML extends Component {
    constructor(props) {
        super(props)
    
        this.state = {
            datasource: null,
            uuidTooltip: uuid.v4(),
        }
    }

    componentDidMount() {
        this._getDatasource()
    }

    componentDidUpdate(prevProps) {
        if (this.props.settings.database !== prevProps.settings.database) {
            this._getDatasource();
        }
    }

    _trainModel = async (name) => {
        const {
            timeRange,
            modelActions: {jobStart},
            notify,
        } = this.props
        const {
            lower,
            upper
        } = convertTimeRange(timeRange)
        
        try {
            const res = await trainAndStartModel(name, lower, upper)
            const job = {
                name,
                id: res.data,
                type: 'training',
                state: 'waiting'
            }

            jobStart(job)
            notify(notifyModelTraining(job))
        } catch (error) {
            console.error(error)
            notify(notifyModelTrainingFailed(name, parseError(error)))
        }
    }

    _getDatasource = async () => {
        const {settings: {database}} = this.props
        const {data} = await getDatasources()
        const datasource = data.find(d => d.database === database)
        this.setState({datasource: datasource&&datasource.name})
    }

    get name() {
        const {
            settings: {
                database,
                measurement,
                fields,
                groupBy: {time},
            }
        } = this.props
        return [
            database,
            measurement,
            fields[0].value,
            fields[0].args[0].value,
            time
        ].join('_')
    }

    _createAndTrainModel = async () => {
        const {
            settings: {
                groupBy: {time},
                fields,
                measurement,
                tags,
                fill,
            },
            modelActions: {modelCreated},
            notify,
        } = this.props
        const {datasource} = this.state
        const model = {
            ...DEFAULT_MODEL,
            max_evals: 10,
            name: this.name,
            interval: normalizeInterval(time),
            default_datasource: datasource,
            bucket_interval: time,
            features: { io: fields.map(
                (field) => ({
                        name: field.alias,
                        measurement,
                        field: field.args[0].value,
                        metric: field.value,
                        default: normalizeFeatureDefault(fill),
                        match_all: Object
                            .keys(tags)
                            .map(k => {
                                return tags[k]
                                    .map(v => {
                                        return {
                                            tag: k,
                                            value: v,
                                        }
                                    })
                            })
                            .reduce((a, v) => {
                                return [...a, ...v]
                            }, []),
                    })
                )
            },
        }

        try {
            await createModel(model)
            await createModelHook(model.name, createHook(ANOMALY_HOOK, model.default_datasource))
            modelCreated(model)
            notify(notifyModelCreated(model.name))
            this._trainModel(model.name)
        } catch (error) {
            console.error(error)
            notify(notifyModelCreationFailed(model.name, parseError(error)))
        }
    }
    
    oneClickModel = () => {
        if (this.isValid) {
            this._createAndTrainModel()
        }
    }

    get sourceNameTooltip() {
        const {
            settings: {
                fields,
                groupBy: {time},
                tags,
                fill,
                areTagsAccepted,
            }
        } = this.props
        const {datasource} = this.state

        const isCheckTags = checkTags(tags)
        const checkTagsAccepted = (Object.keys(tags).length>0 && isCheckTags
            ? areTagsAccepted
            : true)  // don't care

        return [
            notifyDatasource(datasource),
            notifyFeature(fields),
            notifyInterval(time),
            notifyMatch(tags),
            notifyFillValue(fill),
            notifyTagsAccepted(checkTagsAccepted),
        ].join('')
    }

    get isValid() {
        const {settings: {
            fields,
            groupBy: {time},
            tags,
            fill,
            areTagsAccepted,
        }} = this.props
        const {datasource} = this.state
        const isCheckTags = checkTags(tags)
        const checkTagsAccepted = (Object.keys(tags).length>0 && isCheckTags
        ? areTagsAccepted
        : true)  // don't care

        return (datasource!==undefined)
            && (fields&&fields.length===1)
            && (time!==null&&time!=='auto')
            && (isCheckTags===true)
            && (fill!=='linear')
            && (checkTagsAccepted)
    }

    render() {
        const {uuidTooltip} = this.state
        return (
            <div className={classnames('btn', 'btn-sm', 'btn-default', {
                'disabled': !this.isValid,
                })}
                onClick={this.oneClickModel}
                data-for={uuidTooltip}
                data-tip={this.sourceNameTooltip}
            >
                <span className="icon loudml-gradcap" />
                1-Click ML
                <ReactTooltip
                    id={uuidTooltip}
                    effect="solid"
                    html={true}
                    place="left"
                    class="influx-tooltip"
                />
            </div>
        )
    }
}

const {shape, func} = PropTypes

OneClickML.propTypes = {
    timeRange: shape(),
    settings: shape(),
    modelActions: shape({
        jobStart: func.isRequired,
    }).isRequired,
    notify: func.isRequired,
}

function mapStateToProps(state) {
    const {
        timeRange: {upper, lower},
        dataExplorerQueryConfigs,
        dataExplorer,
    } = state

    const settings = (dataExplorer.queryIDs.length>0
        ? dataExplorerQueryConfigs[dataExplorer.queryIDs[0]]
        : null)

    return {
        timeRange: {upper, lower},
        settings,
    }
}

const mapDispatchToProps = dispatch => ({
    modelActions: {
        modelCreated: model => dispatch(modelCreatedAction(model)),
        jobStart: job => dispatch(jobStartAction(job)),
    },
    notify: message => dispatch(notifyAction(message)),
})

export default connect(mapStateToProps, mapDispatchToProps)(OneClickML)
