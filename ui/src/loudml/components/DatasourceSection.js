import React from 'react'
import PropTypes from 'prop-types'

import Dropdown from 'shared/components/Dropdown'

const DatasourceSection = ({
    datasource,
    datasources,
    onChoose,
    buttonSize,
    disabled,
    name,
}) => {
    function handleOnChoose(e) {
        onChoose(name, e.text)
    }

    if (!datasources) {
        return <p>No datasources</p>
    }

    return (
        <Dropdown
            name={name}
            items={datasources.map(ds => ({text: ds.name}))}
            onChoose={handleOnChoose}
            selected={datasource || ''}
            className="dropdown-stretch"
            buttonSize={buttonSize}
            disabled={disabled}
        />
    )
}

DatasourceSection.defaultProps = {
    datasources: [],
}

const {func, string, arrayOf, shape, bool} = PropTypes

DatasourceSection.propTypes = {
    name: string.isRequired,
    datasource: string,
    datasources: arrayOf(shape()),
    onChoose: func.isRequired,
    buttonSize: string,
    disabled: bool.isRequired,
}

export default DatasourceSection
