import React from 'react'

const AboutTextStyle = {
    fontSize: '20px',
    fontWeight: 400,
    margin: 0,
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    color: '#eeeff2',
}

const AboutPanel = () => {
    
    return (
        <div className="panel panel-solid">
            <div className="panel-heading">
                <h2 className="panel-title" />
            </div>
            <div className="panel-body">
                <p style={AboutTextStyle}>
                    You're using Loud ML 1.4 — an independent machine learning add-on designed here for InfluxData’s TICK stack.
                </p>
                <p style={AboutTextStyle}>
                    It's plug-and-play, so you can use it for other projects too.
                </p>
                <p style={AboutTextStyle}>
                    Visit <a href='http://loudml.io' target='_loudml'>loudml.io</a> to download the free Community package and reap the benefits of ML within days.
                </p>
            </div>
        </div>
    )
}

export default AboutPanel
