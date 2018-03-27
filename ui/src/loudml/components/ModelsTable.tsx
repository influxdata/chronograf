import React, {PureComponent} from 'react'
import {Link} from 'react-router'

import ModelsRow from 'src/loudml/components/ModelsRow'
import { TimeRange, Model, Job } from 'src/loudml/types/model';

interface Props {
    source: {id: string}
    models: Model[]
    jobs: Job[]
    onClone: (name: string) => void
    onDelete: (name: string) => void
    onStart: (name: string) => void
    onStop: (name: string) => void
    onTrain: (name: string, timeRange: TimeRange) => void
    onStopTrain: (name: string) => void
    onForecast: (name: string, timeRange: TimeRange) => void
    onStopForecast: (name: string) => void
    onSelectModelGraph: (model: Model) => void
}

class ModelsTable extends PureComponent<Props, {}> {

    public render() {
        const {models} = this.props
        return (
            <div>
                {models.length
                    ? this.renderTable()
                    : this.renderTableEmpty() }
            </div>
        )
    }

    private renderTable() {
        const {
            source,
            models,
            jobs,
            onClone,
            onDelete,
            onStart,
            onStop,
            onTrain,
            onStopTrain,
            onForecast,
            onStopForecast,
            onSelectModelGraph,
        } = this.props
    
        return (
            <table className="table v-center margin-bottom-zero table-highlight">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Loss</th>
                        <th>Status</th>
                        <th/>
                        <th/>
                    </tr>
                </thead>
                <tbody>
                    {models.map(model => {
                        return (
                            <ModelsRow key={model.settings.name}
                                model={model}
                                jobs={jobs.filter(job => job.name === model.settings.name)}
                                source={source}
                                onClone={onClone}
                                onDelete={onDelete}
                                onStart={onStart}
                                onStop={onStop}
                                onTrain={onTrain}
                                onStopTrain={onStopTrain}
                                onForecast={onForecast}
                                onStopForecast={onStopForecast}
                                onSelectModelGraph={onSelectModelGraph}
                            />
                        )
                    }, this)}
                </tbody>
            </table>
        )
    }

    private renderTableEmpty() {
        const {source: {id}} = this.props
        return (
            <div className="generic-empty-state">
                <h4 className="no-user-select">Looks like you don't have any models</h4>
                <br />
                <h6 className="no-user-select">
                    <Link
                        style={{marginLeft: '10px'}}
                        to={`/sources/${id}/loudml/models/new`}
                        className="btn btn-primary btn-sm"
                    >
                        <span className="icon plus" />
                        Create a model
                    </Link>
                </h6>
            </div>
        )
    }

    get title () {
        const {models} = this.props

        return `${models.length} Model${models.length>1 ? 's': ''}`
    }

}

export default ModelsTable
