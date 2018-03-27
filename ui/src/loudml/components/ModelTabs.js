import React, { Component } from 'react'
import PropTypes from 'prop-types'

import SubSectionsTab from 'src/shared/components/SubSectionsTab'

class ModelTabs extends Component {
    constructor(props) {
        super(props)

    }

    render() {
        const {sections, activeSection, onTabClick} = this.props

        return (
            <div className="row subsection">
                <div className="col-md-2 subsection--nav">
                    <div className="subsection--tabs">
                        {sections.map(
                            section =>
                                section.enabled && (
                                <SubSectionsTab
                                    key={section.url}
                                    section={section}
                                    handleClick={onTabClick(section.url)}
                                    activeSection={activeSection}
                                />)
                            )}
                    </div>
                </div>
                <div className="col-md-10 subsection--content">
                    {this.activeSectionComponent}
                </div>
            </div>
        )
    }

    get activeSectionComponent() {
        const {sections, activeSection} = this.props
        const {component} = sections.find(section => section.url === activeSection)
        return component    
    }

}

const {func, shape, string, arrayOf} = PropTypes

ModelTabs.propTypes = {
    activeSection: string.isRequired,
    onTabClick: func.isRequired,
    sections: arrayOf(shape()).isRequired,
}

export default ModelTabs
