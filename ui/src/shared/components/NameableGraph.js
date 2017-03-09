import React, {PropTypes} from 'react'

const NameableGraph = ({name, key, children}) => {
  return (
    <div key={key}>
      <h2 className="dash-graph--heading">{name}</h2>
      <div className="dash-graph--container">
        {children}
      </div>
    </div>
  );
}

NameableGraph.propTypes = {
  name: PropTypes.string.isRequired,
  key: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
}

NameableGraph.defaultProps = {
  name: "Graph",
}

export default NameableGraph;
