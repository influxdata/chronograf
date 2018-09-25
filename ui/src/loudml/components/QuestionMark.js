import React from 'react'
import ReactTooltip from 'react-tooltip'

const QuestionMark = () => {

    const openInNewTab = url => () => {
        const win = window.open(url, '_loudml');
        win.focus();
    }

    return (
        <div className="question-mark-tooltip">
            <div
                className="question-mark-tooltip--icon"
                data-for='loudml-tooltip'
                data-tip='Visit <code>loudml.io</code>'
                onClick={openInNewTab('http://loudml.io')}
                >
                ?
            </div>
            <ReactTooltip
                id='loudml-tooltip'
                effect="solid"
                html={true}
                place="bottom"
                class="influx-tooltip"
                />
        </div>
    )

}

export default QuestionMark
