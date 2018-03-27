import React, {Component} from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import OnClickOutside from 'shared/components/OnClickOutside'

import {MODEL_GRAPHS} from 'src/loudml/constants/graph'

import 'src/loudml/styles/graph.scss'

class DashboardDropdown extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isOpen: false,
        }
    }

    handleClickOutside() {
        this.setState({isOpen: false})
    }

    handleSelection = graph => () => {
        const {model, onChoose} = this.props

        onChoose(model, graph)
        this.setState({isOpen: false})
    }

    toggleMenu = () => this.setState({isOpen: !this.state.isOpen})

    render() {
        const {isOpen} = this.state

        return (
            <div className="dashboard-dropdown">
                <div className={classnames(
                    'dropdown', {
                        'table--show-on-row-hover': !isOpen,
                        open: isOpen,
                    })}>
                    <div
                        className="btn btn-xs btn-default dropdown-toggle dropdown-graphml"
                        onClick={this.toggleMenu}
                    >
                        <span className="icon dash-h" />
                        <span className="caret" />
                    </div>
                    <ul className="dropdown-menu">
                        {MODEL_GRAPHS.map(item => (
                        <li className="dropdown-item" key={item.menuOption}>
                            <a
                                href="#"
                                style={{whiteSpace: 'nowrap'}}
                                onClick={this.handleSelection(item.graph)}>
                                {item.menuOption}
                            </a>
                        </li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    }
}

const {shape, func} = PropTypes

DashboardDropdown.propTypes = {
    model: shape().isRequired,
    onChoose: func.isRequired,
}

export default OnClickOutside(DashboardDropdown)
