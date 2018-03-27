import React, { PureComponent } from 'react'

import ConfirmButton from 'src/shared/components/ConfirmButton'

import {Model, TimeRange, Job} from 'src/loudml/types/model'
import JobButton from 'src/loudml/components/JobButton'
import TrainTimeJobButton from 'src/loudml/components/TrainTimeJobButton'
import ForecastTimeJobButton from 'src/loudml/components/ForecastTimeJobButton'

import 'src/loudml/styles/loudml.scss'

interface Props {
    model: Model
    jobs: Job[]
    onStart: (name: string) => void
    onStop: (name: string) => void
    onTrain: (name: string, timeRange: TimeRange) => void
    onStopTrain: (name: string) => void
    onForecast: (name: string, timeRange: TimeRange) => void
    onStopForecast: (name: string) => void
    onDelete: (name: string) => void
}

class ModelActions extends PureComponent<Props, {}> {
    constructor(props) {
        super(props)

        this.handleOnTrain = this.handleOnTrain.bind(this)
        this.handleOnForecast = this.handleOnForecast.bind(this)
    }

    public handleOnTrain(timeRange: TimeRange) {
        const {model, onTrain} = this.props

        onTrain(model.settings.name, timeRange)
    }

    public handleOnForecast(timeRange: TimeRange) {
        const {model, onForecast} = this.props

        onForecast(model.settings.name, timeRange)
    }

    public handleDeleteModel = () => {
        const {model, onDelete} = this.props
        
        onDelete(model.settings.name)
    }

    public render() {
        const {
            model: {
                settings: { name, run, },
                state: { trained, },
                training,
            },
            jobs,
            onStart,
            onStop,
            onStopTrain,
            onStopForecast,
        } = this.props

        return (
            <div className="actions-container">
                <JobButton
                    startLabel='Play'
                    stopLabel='Stop'
                    onStart={onStart(name)}
                    onStop={onStop(name)}
                    running={run!==undefined}
                    disabled={trained===false
                        &&run===undefined}
                    customClass="table--show-on-row-hover"
                />
                <ForecastTimeJobButton
                    startLabel='Forecast'
                    stopLabel='Stop forecast'
                    onStart={this.handleOnForecast}
                    onStop={onStopForecast(name)}
                    disabled={trained===false}
                    running={
                        jobs.filter(
                            job =>
                                job.name === name
                                && job.type === 'forecast'
                        ).length !== 0
                    }
                />
                <TrainTimeJobButton
                    startLabel='Train'
                    stopLabel='Stop training'
                    onStart={this.handleOnTrain}
                    onStop={onStopTrain(name)}
                    running={
                        (training&&training.state==='running')
                        || jobs.filter(
                            job =>
                                job.name === name
                                && job.type === 'training'
                            ).length !== 0
                    }
                />
                <ConfirmButton
                    confirmAction={this.handleDeleteModel}
                    size="btn-xs"
                    square={true}
                    icon="trash"
                    confirmText="Delete this model"
                    customClass="table--show-on-row-hover"
                />
            </div>
        )
    }
}

export default ModelActions
