import React from 'react'

export default function NameableGraph(ComposedGraph) {
  return ({name, key, ...props}) => {
    return (
      <div key={key}>
        <h2 className="dash-graph--heading">{name}</h2>
        <div className="dash-graph--container">
          <ComposedGraph {...props} />
        </div>
      </div>
    );
  }
}
