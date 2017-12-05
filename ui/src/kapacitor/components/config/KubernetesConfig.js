import React, {PropTypes, Component} from 'react'

// import RedactedInput from './RedactedInput'

class KubernetesConfig extends Component {
  constructor(props) {
    super(props)
  }

  handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      'api-servers': [this.apiServers.value],
      enabled: this.enabled.checked,
      // 'ca-path': this.caPath.value,
      // 'in-cluster': this.inCluster.checked,
    }

    this.props.onSave(properties)
  }

  handleTokenRef = r => (this.token = r)

  render() {
    const {
      apiServers,
      enabled,
      // resource,
      // caPath,
      // inCluster,
      // namespace,
      // token,
    } = this.props.config.options
    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <div className="form-control-static">
            <input
              id="enabled"
              type="checkbox"
              defaultChecked={enabled}
              ref={r => (this.enabled = r)}
            />
            <label htmlFor="enabled">Enable Kubernetes auto-scaling</label>
          </div>
        </div>

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

        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update Kubernetes Config
          </button>
        </div>
      </form>
    )
  }
}

// id?

// <div className="form-group col-xs-12">
//   <label htmlFor="caPath">CA Path</label>
//   <input
//     className="form-control"
//     id="caPath"
//     type="text"
//     ref={r => (this.caPath = r)}
//     defaultValue={caPath || ''}
//   />
// </div>
// <div className="form-group col-xs-12">
//   <div className="form-control-static">
//     <input
//       id="inCluster"
//       type="checkbox"
//       defaultChecked={inCluster}
//       ref={r => (this.inCluster = r)}
//     />
//     <label htmlFor="inCluster">In cluster?</label>
//   </div>
// </div>
// <div className="form-group col-xs-12">
//   <label htmlFor="namespace">Namespace</label>
//   <input
//     className="form-control"
//     id="namespace"
//     type="text"
//     ref={r => (this.namespace = r)}
//     defaultValue={namespace || ''}
//   />
// </div>
// <div className="form-group col-xs-12">
//   <label htmlFor="resource">Resource</label>
//   <input
//     className="form-control"
//     id="resource"
//     type="text"
//     ref={r => (this.resource = r)}
//     defaultValue={resource || ''}
//   />
// </div>
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
