import React, {Component} from 'react'
import {PropTypes} from 'prop-types'

import 'src/loudml/styles/progress.css'

class Progress extends Component {
    constructor(props) {
        super(props)

        const [startX, startY] = this.getCoordinatesForPercent(0)
        this.state = {
            startX,
            startY,
        }
    }

    getCoordinatesForPercent(percent) {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

    // from https://hackernoon.com/a-simple-pie-chart-in-svg-dbdd653b6936
    get path() {
        const {iteration, maxEvals} = this.props
        const {startX, startY} = this.state

        const percent = iteration/maxEvals
        const [endX, endY] = this.getCoordinatesForPercent(iteration/maxEvals)

        // if the slice is more than 50%, take the large arc (the long way around)
        const largeArcFlag = percent > .5 ? 1 : 0

        const pathData = [
            `M ${startX} ${startY}`, // Move
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
            `L 0 0`,
        ]

        return pathData.join(' ')
    }

    // from Sampson answer https://stackoverflow.com/questions/21205652/how-to-draw-a-circle-sector-in-css
    get pieStyle() {
        const {
            iteration,
            maxEvals,
            backgroundColor,
            color,
        } = this.props

        const percent = iteration/maxEvals

        /* 
            Slices greater than 50% require first gradient
            to be transparent -> {color}
        */
/*
(0.03!==0.5 ? linear-gradient(
        {(0.03<50 ? 360*percent+90 : 360*percent-90)}deg,
        transparent 50%,
        {(0.03<=50 ? #0f0e15 : #22ADF6)} 50% : ''),
        linear-gradient(90deg, #0f0e15 50%, transparent 50%)

gradient linear-gradient(252deg, transparent 50%, #22ADF6 50%),
    linear-gradient(90deg, #0f0e15 50%, transparent 50%)

    .seventyfive {
    background-image:
        linear-gradient(180deg, transparent 50%, #22ADF6 50%),
        linear-gradient(90deg, #0f0e15 50%, transparent 50%);
}

*/
        const deg = Math.floor(360*percent)
        const first = (percent<=0.5
            ? `${deg+90}deg, transparent 50%, ${backgroundColor} 50%`
            : `${deg-90}deg, transparent 50%, ${color} 50%`)

        const gradient = (percent!==0.5
            ? `linear-gradient(${first}),
                linear-gradient(90deg, ${backgroundColor} 50%, transparent 50%)`
            : `linear-gradient(90deg, ${backgroundColor} 50%, transparent 50%)`)

        console.log('gradient', gradient)
        return gradient
    }

    render() {
/*
        const {iteration, maxEvals} = this.props
        return (
            <progress
                value={iteration}
                min="0"
                max={maxEvals}>
                <span>50%</span>
            </progress>
        )
        */
        /*
        return (
            <svg
                enableBackground={true}
                shapeRendering="geometricPrecision"
                width="16"
                height="16"
                viewBox="-1 -1 2 2"
                style={{transform: 'rotate(-0.25turn)'}}>
                <circle
                    cx="0"
                    cy="0"
                    r="1"
                    stroke="#22ADF6"
                    fill="transparent"
                    strokeWidth="0.05" />
                <path
                    d={this.path}
                    fill="#22ADF6">
                </path>
            </svg>
        )
        */
        const {
            color,
        } = this.props

        return (
            <pie style={{
                backgroundImage: this.pieStyle,
                width: '16px',
                height: '16px',
                display: 'block',
                borderRadius: '50%',
                backgroundColor: `${color}`,
                border: `1px solid ${color}`,
                float: 'left',
                margin: '1em'               
            }}></pie>
        )        
    }
}

Progress.defaultProps = {
    backgroundColor: '#0f0e15',
    color: '#22ADF6',    
}

Progress.propTypes = {
    iteration: PropTypes.number.isRequired,
    maxEvals: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string,
    color: PropTypes.string,    
}

export default Progress
