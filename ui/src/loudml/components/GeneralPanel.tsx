import React, { SFC } from 'react'

import NameSection from 'src/loudml/components/NameSection'
import DatasourceSection from 'src/loudml/components/DatasourceSection'

import { Datasource } from 'src/loudml/types/datasource';
import { ModelSettings } from 'src/loudml/types/model';

interface Props {
    model: ModelSettings
    onInputChange: (e: any) => void
    onDatasourceChoose: (e: any) => void
    isEditing: boolean
    datasources: Datasource[]
    locked: boolean
}

const GeneralPanel: SFC<Props> = ({
    model,
    onInputChange,
    onDatasourceChoose,
    isEditing,
    datasources,
    locked,
}) => (
    <div className="panel panel-solid">
        <div className="panel-heading">
            <h2 className="panel-title" />
        </div>
        <div className="panel-body">
            <div className="form-group col-xs-12 col-sm-12">
                <label>
                    {isEditing ? 'Name this model' : 'Name'}
                </label>
                <NameSection
                    modelName={model.name}
                    onEdit={onInputChange}
                    isEditing={isEditing}
                    />
            </div>
            <div className="form-group col-xs-12 col-sm-6">
                <label>Data source</label>
                <DatasourceSection
                    name="default_datasource"
                    datasource={model.default_datasource}
                    datasources={datasources}
                    onChoose={onDatasourceChoose}
                    buttonSize="btn-md"
                    disabled={locked}
                />
            </div>
            <div className="form-group col-xs-12 col-sm-6">
                <label htmlFor="max_evals">Max training iterations</label>
                <input
                    type="number"
                    name="max_evals"
                    className="form-control input-md form-malachite"
                    value={model.max_evals}
                    onChange={onInputChange}
                    placeholder="ex: 100"
                />
            </div>
            <div className="form-group col-xs-12 col-sm-6">
                <label>Data sink</label>
                <DatasourceSection
                    name="default_datasink"
                    datasource={model.default_datasink}
                    datasources={datasources}
                    onChoose={onDatasourceChoose}
                    buttonSize="btn-md"
                    disabled={locked}
                />
            </div>
        </div>
    </div>
)

export default GeneralPanel
