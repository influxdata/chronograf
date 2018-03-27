import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {Link} from 'react-router'

import {errorThrown as errorThrownAction} from 'shared/actions/errors'
import {notify as notifyAction} from 'shared/actions/notifications'
import PageHeader from 'src/reusable_ui/components/page_layout/PageHeader'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import SearchBar from 'src/hosts/components/SearchBar'

import {ErrorHandling} from 'src/shared/decorators/errors'

import ModelsTable from 'src/loudml/components/ModelsTable'

import {
    getDashboards,
    createDashboard,
    addDashboardCell,
    updateDashboardCell,
} from 'src/dashboards/apis'
import {createQueryFromModel} from 'src/loudml/utils/query'
import {convertTimeRange} from 'src/loudml/utils/timerange'
import {parseError} from 'src/loudml/utils/error'
import {findSource} from 'src/loudml/utils/datasource';
import * as api from 'src/loudml/apis'
import {getSources} from 'src/shared/apis';
import {
    modelsLoaded as modelsLoadedAction,
    modelDeleted as modelDeletedAction,
    modelCreated as modelCreatedAction,
    jobStart as jobStartAction,
    jobStop as jobStopAction,
    jobsUpdate as jobsUpdateAction,
} from "src/loudml/actions/view"

import {
    notifyErrorGettingModels,
    notifyModelDeleted,
    notifyModelDeleteFailed,
    notifyModelStarting,
    notifyModelStartingFailed,
    notifyModelTraining,
    notifyModelTrainingFailed,
    notifyModelForecasting,
    notifyModelForecastingFailed,
    notifyModelStopped,
    notifyModelStoppedFailed,
    notifyJobSuccess,
    notifyJobFailed,
    notifyJobStopped,
    notifyJobStoppedFailed,
    notifyDashboardCreated,
    notifyDashboardCreationFailed,
    notifyErrorGettingModelHook,
} from 'src/loudml/actions/notifications'
import {
    DEFAULT_CONFIDENT_DASHBOARD,
    DEFAULT_CONFIDENT_CELL
} from 'src/loudml/constants/dashboard';
import {ANOMALY_HOOK_NAME} from 'src/loudml/constants/anomaly'

import 'src/loudml/styles/notification.scss'

@ErrorHandling
class LoudMLPage extends Component {
    constructor(props) {
        super(props)

        this.state = {
            searchTerm: '',
          }      
    }

    componentDidMount() {
        this._loadModels()

        this.jobFetchID = setInterval(
            () => this.fetchJobsState(),
            10000
        )
        this.jobStatusID = setInterval(
            () => this.notifyJobsState(),
            10000
        )
        this.fetchModelsID = setInterval(
            () => this._loadModels(),
            10000
        )
    }

    componentWillUnmount() {
        if (this._asyncRequest) {
            this._asyncRequest.cancel();
        }
        clearInterval(this.fetchModelsID)
        this.fetchModelsID = false
        clearInterval(this.jobStatusID)
        this.jobStatusID = false
        clearInterval(this.jobFetchID)
        this.jobFetchID = false
    }

    _loadModels() {
        const {
            modelActions: {modelsLoaded},
            notify,
            isFetching,
        } = this.props

        if (isFetching && this._asyncRequest) {
            return
        }

        this._asyncRequest = api.getModels()
        .then(res => {
            this._asyncRequest = null;
            modelsLoaded(res.data)
        })
        .catch(error => {
            notify(notifyErrorGettingModels(parseError(error)))
        })
    }

    notifyJobsState() {
        const {
            jobs,
            modelActions: {jobStop},
            notify
        } = this.props

        // notify if needed
        const jobsFinished = jobs
            .filter(job => ['done', 'failed'].includes(job.state))
        jobsFinished.forEach(job => (
            job.state === 'done' ? notify(notifyJobSuccess(job)) : notify(notifyJobFailed(job))
        ))
        // update state
        jobsFinished.forEach(job => jobStop(job))
    }

    fetchJobsState() {
        const {
            jobs,
            modelActions: {jobsUpdate},
            errorThrown,
        } = this.props

        if (!jobs || !jobs.length) {
            return
        }

        Promise.all(
            jobs.map(
                job => api.getJob(job.id)
            )
        )
            .then(res => {
                const datas = res.map(v => v.data)
                jobsUpdate(datas)
            })
            .catch(error => {
                errorThrown(error)
            })
    }

    cloneModel = async (name) => {
        const {
            modelActions: {modelCreated},
            router,
            models,
            source: {id},
        } = this.props

        const copy = {
            ...models.find(m => m.settings.name === name).settings
        }
        copy.name = `Copy of ${name}`
        copy.isEditing = true

        const annotation = await this.hasHook(name)
        copy.annotation = annotation

        modelCreated(copy)
        router.push(`/sources/${id}/loudml/models/${copy.name}/edit`)
    }

    hasHook = async (name) => {
        const {notify} = this.props

        try {
            const {data: hooks} = await api.getModelHooks(name)
            const hook = hooks.find(h => h === ANOMALY_HOOK_NAME)
            return (hook!==undefined)
        } catch (error) {
            notify(notifyErrorGettingModelHook(name, ANOMALY_HOOK_NAME, parseError(error)))
        }
        return false
    }

    deleteModel = name => {
        const {
            modelActions: {modelDeleted},
            notify
        } = this.props

        api.deleteModel(name)
            .then(() => {
                modelDeleted(name)
                notify(notifyModelDeleted(name))
            })
              .catch(error => {
                notify(notifyModelDeleteFailed(name, error))
            })
    }

    startJob = (
        name,
        apiCallback,
        jobType,
        notifySucessCallback,
        notifyErrorCallback
    ) => {
        const {
            modelActions: {jobStart},
            notify
        } = this.props
      
        apiCallback
            .then((res) => {
                const job = {
                    name,
                    id: res.data,
                    type: jobType,
                    state: 'waiting'
                }

                jobStart(job)
                notify(notifySucessCallback(job))
            })
            .catch(error => {
                notify(notifyErrorCallback(name, parseError(error)))
            })
    }

    trainModel = (name, timeRange) => {
        const {lower, upper} = convertTimeRange(timeRange)
        this.startJob(
            name,
            api.trainModel(name, lower, upper),
            'training',
            notifyModelTraining,
            notifyModelTrainingFailed,
        )
    }

    forecastModel = (name, timeRange) => {
        const {lower, upper} = convertTimeRange(timeRange)
        this.startJob(
            name,
            api.forecastModel(name, lower, upper),
            'forecast',
            notifyModelForecasting,
            notifyModelForecastingFailed,
        )
    }

    startModel = name => () => {
        const {notify} = this.props

        api.startModel(name)
            .then(() => {
                notify(notifyModelStarting(name))
            })
            .catch(error => {
                notify(notifyModelStartingFailed(name, parseError(error)))
            })
    }

    stopModel = name => () => {
        const {notify} = this.props

        api.stopModel(name)
            .then(() => {
                notify(notifyModelStopped(name))
            })
            .catch(error => {
                notify(notifyModelStoppedFailed(name, parseError(error)))
            })
    }

    stopJob = (name, id) => {
        const {
            notify,
            modelActions: {jobStop},
            jobs,
        } = this.props

        const job = jobs.find(i => i.id === id)

        api.stopJob(id)
            .then(() => {
                jobStop(job)
                notify(notifyJobStopped(name))
            })
            .catch(error => {
                notify(notifyJobStoppedFailed(name, parseError(error)))
            })
    }

    stopTrain = name => () => {
        const {models} = this.props

        // get job
        const id = models
            .find(model => model.settings.name === name)
            .training
            .job_id
        this.stopJob(name, id)
    }

    stopForecast = name => () => {
        const {jobs} = this.props

        // get job
        const id = jobs
            .find(job => job.name === name && job.type === 'forecast')
            .id
        this.stopJob(name, id)
    }

    createOrUpdateConfident = (dashboard, model, source, database) => {
        const {settings: {name}} = model
        const cellName = `${name} prediction`
        const queries = createQueryFromModel(model, source, database)

        if (dashboard===undefined) {
            // create
            dashboard = {
                ...DEFAULT_CONFIDENT_DASHBOARD,
                name,
                cells: [
                    {
                        ...DEFAULT_CONFIDENT_CELL,
                        name: cellName,
                        queries,
                    }
                ]
            }
            return createDashboard(dashboard)
        }
        const cell = dashboard.cells.find(item => item.name === cellName)
        if (cell===undefined) {
            return addDashboardCell(dashboard, {
                ...DEFAULT_CONFIDENT_CELL,
                name: cellName,
                queries,
            })
        }
        return updateDashboardCell({
            ...cell,
            type: 'error',
            queries,
        })
    }
    
    selectModelGraph = async (model) => {
        const {notify} = this.props
        const {settings} = model
        
        try {
            const {data: {dashboards}} = await getDashboards()
            const dashboard = dashboards.find(item => item.name === settings.name)
            const {data} = await api.getDatasources()
            const datasource = data.find(d => d.name === settings.default_datasource)
            const {data: {sources}} = await getSources()
            const source = findSource(sources, datasource)
            await this.createOrUpdateConfident(dashboard, model, source, datasource.database)
            notify(notifyDashboardCreated(settings.name))
        } catch (error) {
            console.error(error)
            notify(notifyDashboardCreationFailed(settings.name, parseError(error)))
        }
    }

    openInNewTab = url => () => {
        const win = window.open(url, '_loudml');
        win.focus();
    }
    
    renderHeaderOptions = () => {
        return (
            <div className="question-mark-tooltip">
                <div
                    className="question-mark-tooltip--icon"
                    onClick={this.openInNewTab('http://loudml.io')}
                    >
                    ?
                </div>
            </div>
        )
    }
    
    render() {
        const {isFetching, jobs, source} = this.props

        if (isFetching) {
            return <div className="page-spinner" />
        }

        return (
            <div className="page">
                <PageHeader
                    titleText="Manage Machine Learning Tasks"
                    sourceIndicator={true}
                    optionsComponents={this.renderHeaderOptions()}
                    />
                <FancyScrollbar className="page-contents">
                    <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                        <div className="panel">
                            {this.renderPanelHeading}
                            <div className="panel-body">
                            <ModelsTable
                                    source={source}
                                    models={this.filteredModels}
                                    jobs={jobs}
                                    onClone={this.cloneModel}
                                    onDelete={this.deleteModel}
                                    onStart={this.startModel}
                                    onStop={this.stopModel}
                                    onTrain={this.trainModel}
                                    onStopTrain={this.stopTrain}
                                    onForecast={this.forecastModel}
                                    onStopForecast={this.stopForecast}
                                    onSelectModelGraph={this.selectModelGraph}
                                />
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </FancyScrollbar>
            </div>
        )
    }

    get renderPanelHeading() {
        const {source: {id}} = this.props

        return (
            <div className="panel-heading">
                <h2 className="panel-title">{this.panelTitle}</h2>
                <div className="panel-controls">
                    <SearchBar
                        placeholder="Filter by Name..."
                        onSearch={this.filterModels}
                        />
                    <Link
                        to={`/sources/${id}/loudml/models/new`}
                        className="btn btn-sm btn-primary btn-sm"
                        >
                        <span className="icon plus" />
                        Create a model
                    </Link>
                </div>
            </div>
        )
      }
      
    get panelTitle() {
        const {models} = this.props
    
        if (models === null) {
            return 'Loading Models...'
        } else if (models.length === 1) {
            return '1 Model'
        }
    
        return `${models.length} Models`
      }
    
    filterModels = (searchTerm) => {
        this.setState({searchTerm})
    }
    
    get filteredModels() {
        const {models} = this.props
        const {searchTerm} = this.state
    
        return models.filter(m =>
            m.settings.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
    
}

const {arrayOf, func, shape, bool} = PropTypes

LoudMLPage.propTypes = {
    source: shape({}),
    router: shape({
        push: func.isRequired,
    }).isRequired,
    models: arrayOf(shape()).isRequired,
    isFetching: bool.isRequired,
    jobs: arrayOf(shape()).isRequired,
    modelActions: shape({
        modelsLoaded: func.isRequired,
        modelDeleted: func.isRequired,
        jobStart: func.isRequired,
        jobStop: func.isRequired,
        jobsUpdate: func.isRequired,
    }).isRequired,
    notify: func.isRequired,
    errorThrown: func.isRequired,
}

function mapStateToProps(state) {
    const { isFetching, models } = state.loudml.models
    const { jobs } = state.loudml.jobs

    return {
        models,
        isFetching,
        jobs
    }
}

const mapDispatchToProps = dispatch => ({
    modelActions: {
        modelsLoaded: models => dispatch(modelsLoadedAction(models)),
        modelCreated: name => dispatch(modelCreatedAction(name)),
        modelDeleted: name => dispatch(modelDeletedAction(name)),
        jobStart: job => dispatch(jobStartAction(job)),
        jobStop: job => dispatch(jobStopAction(job)),
        jobsUpdate: jobs => dispatch(jobsUpdateAction(jobs)),
    },
    notify: message => dispatch(notifyAction(message)),
    errorThrown: error => dispatch(errorThrownAction(error))
})

export default connect(mapStateToProps, mapDispatchToProps)(LoudMLPage)
