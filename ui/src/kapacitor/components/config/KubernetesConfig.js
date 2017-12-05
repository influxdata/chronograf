import React, {PropTypes, Component} from 'react'

// import RedactedInput from './RedactedInput'

class KubernetesConfig extends Component {
  constructor(props) {
    super(props)
  }

  handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      apiServers: this.apiServers.value,
      resource: this.resource.value,
    }

    this.props.onSave(properties)
  }

  handleTokenRef = r => (this.token = r)

  render() {
    const {apiServers, resource} = this.props.config.options
    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="apiServers">API Servers</label>
          <input
            className="form-control"
            id="apiServers"
            type="text"
            ref={r => (this.apiServers = r)}
            defaultValue={apiServers || ''}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="resource">
            Resource Dropdown: node/pod/service/endpoint
          </label>
          <input
            className="form-control"
            id="resource"
            type="text"
            ref={r => (this.resource = r)}
            defaultValue={resource || ''}
          />
        </div>
        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update Kubernetes Config
          </button>
        </div>
      </form>
    )
  }
}

//   <div className="form-group col-xs-12">
//     <label htmlFor="inCluster">In cluster checkbox</label>
//     <input
//       className="form-control"
//       id="inCluster"
//       type="text"
//       ref={r => (this.inCluster = r)}
//       defaultValue={inCluster || ''}
//     />
//   </div>
// <div className="form-group col-xs-12">
//   <label htmlFor="token">Token</label>
//   <input
//     className="form-control"
//     id="token"
//     type="text"
//     ref={r => (this.token = r)}
//     defaultValue={token || ''}
//   />
// </div>
// <div className="form-group col-xs-12">
//   <label htmlFor="caPath">CA path</label>
//   <input
//     className="form-control"
//     id="caPath"
//     type="text"
//     ref={r => (this.caPath = r)}
//     defaultValue={caPath || ''}
//   />
// </div>

const {bool, func, shape, string} = PropTypes

KubernetesConfig.propTypes = {
  config: shape({
    options: shape({
      environment: string,
      origin: string,
      token: bool,
      url: string,
    }).isRequired,
  }).isRequired,
  onSave: func.isRequired,
}

export default KubernetesConfig
