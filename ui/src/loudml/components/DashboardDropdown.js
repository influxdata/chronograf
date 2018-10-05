import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import OnClickOutside from 'shared/components/OnClickOutside'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {DROPDOWN_MENU_MAX_HEIGHT} from 'shared/constants/index'

import 'src/loudml/styles/graph.scss'

export class DashboardDropdown extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isOpen: false,
        }
    }

    render() {
        const {isOpen} = this.state
        const {dashboards} = this.props

        return (
            <div className={classnames(
                'dropdown', {
                    'table--show-on-row-hover': !isOpen,
                    open: isOpen,
                })}
                onClick={this.toggleMenu}>
                <div
                    className="btn btn-xs btn-default dropdown-toggle dropdown-graphml"
                >
                    <span className="icon dash-h" />
                    <span className="caret" />
                </div>
                {isOpen ? (
                <ul className="dropdown-menu">
                    <FancyScrollbar
                        autoHide={false}
                        autoHeight={true}
                        maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
                        >
                        {this.basicActionItem()}
                        {dashboards.length ? (
                            <li className="dropdown-header" data-test={'addTo'}>
                                Add to...
                            </li>) : null}
                        {dashboards.map(item => (
                            <li className="dropdown-item" key={item.id}>
                                <a
                                    href="#"
                                    style={{whiteSpace: 'nowrap'}}
                                    onClick={this.handleSelection(item)}>
                                    <span className="icon dash-h"></span> {item.name}
                                </a>
                            </li>
                        ))}
                    </FancyScrollbar>
                </ul>) : null}
            </div>
        )
    }

    basicActionItem = () => {
        const {
            model: {settings: {name}},
            dashboards
        } = this.props

        const dashboard = dashboards.find(d => (d.name === name))
        if (dashboard) {
            return (
                <li className="dropdown-item" data-test="view">
                    <a href="#" onClick={this.handleView(dashboard)}>
                        View in dashboard
                    </a>
                </li>
            )
        }

        return (
            <li className="dropdown-item" data-test="new">
                <a href="#" onClick={this.handleNew}>
                    New dashboard
                </a>
            </li>
        )
    }

    handleClickOutside() {
        this.setState({isOpen: false})
    }

    handleSelection = dashboard => () => {
        const {model, onAddTo} = this.props

        onAddTo(model, dashboard)
        this.setState({isOpen: false})
    }

    toggleMenu = () => this.setState({isOpen: !this.state.isOpen})

    handleView = dashboard => () => {
        const {onView} = this.props

        onView(dashboard)
        this.setState({isOpen: false})
    }

    handleNew = () => {
        const {model, onNew} = this.props

        onNew(model)
        this.setState({isOpen: false})
    }
    
}

const {shape, arrayOf, func} = PropTypes

DashboardDropdown.propTypes = {
    model: shape().isRequired,
    dashboards: arrayOf(shape()),
    onAddTo: func.isRequired,
    onNew: func.isRequired,
    onView: func.isRequired,
}

export default OnClickOutside(DashboardDropdown)
