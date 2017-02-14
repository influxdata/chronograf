import React, {PropTypes} from 'react';
import {getKapacitor, getKapacitorConfigSection, createKapacitor, updateKapacitor, pingKapacitor} from 'shared/apis';
import AlertOutputs from '../components/AlertOutputs';
// default values for name & url
const defaultKapacitorName = "My Kapacitor";
const defaultKapacitorUrl = "http://localhost:9092";

export const KapacitorPage = React.createClass({
  propTypes: {
    source: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }),
    addFlashMessage: PropTypes.func,
  },

  getInitialState() {
    return {
      kapacitor: null,
      canConnect: false,
    };
  },

  componentDidMount() {
    this.fetchKapacitor();
  },

  fetchKapacitor() {
    const {source} = this.props;
    getKapacitor(source).then((kapacitor) => {
      if (!kapacitor) {
        return;
      }
      this.setState({kapacitor}, () => {
        pingKapacitor(kapacitor).catch(() => {
          this.props.addFlashMessage({type: 'error', text: 'Could not connect to Kapacitor. Check settings.'});
        });
      });
    });
  },

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.kapacitor || !this.state.kapacitor) {
      return;
    }
    if (prevState.kapacitor.url !== this.state.kapacitor.url) {
      this.checkKapacitorSetup();
    }
  },

  checkKapacitorSetup() {
    const {addFlashMessage, source} = this.props;
    getKapacitorConfigSection(this.state.kapacitor, 'influxdb').then(({data: {elements}}) => {
      const sourceMatch = elements[0].options.urls.some((url) => url === source.url);
      if (!sourceMatch) {
        addFlashMessage({type: 'warning', text: `Warning: Kapacitor is configured to use an instance of InfluxDB which does not match the URL of your current source. Please ensure your InfluxDB source and Kapacitor's InfluxDB configuration point to the same server.`});
      }
    }).catch(() => {
      addFlashMessage({type: 'error', text: `Could not connect to Kapacitor. Check connection settings.`});
    });
  },

  handleKapacitorUpdate(e) {
    e.preventDefault();
    if (this.state.kapacitor) {
      this.handleUpdateKapacitor();
    } else {
      this.handleCreateKapacitor();
    }
  },

  handleCreateKapacitor() {
    const {addFlashMessage, source} = this.props;
    const {newURL, newName, newUsername} = this.state;
    createKapacitor(source, {
      url: (newURL || defaultKapacitorUrl).trim(),
      name: (newName || defaultKapacitorName).trim(),
      username: newUsername,
      password: this.kapacitorPassword.value,
    }).then(({data: createdKapacitor}) => {
      addFlashMessage({type: 'success', text: 'Kapacitor Created!'});
      this.setState({kapacitor: createdKapacitor});
    }).catch(() => {
      this.props.addFlashMessage({type: 'error', text: 'There was a problem creating the Kapacitor record'});
    });
  },

  handleUpdateKapacitor() {
    const {addFlashMessage} = this.props;
    const {kapacitor, newURL, newName, newUsername} = this.state;
    updateKapacitor(kapacitor, {
      url: (newURL || kapacitor.url).trim(),
      name: (newName || kapacitor.name).trim(),
      username: newUsername || kapacitor.username,
      password: this.kapacitorPassword.value,
    }).then(({data: newKapacitor}) => {
      addFlashMessage({type: 'success', text: 'Kapacitor Updated!'});
      this.setState({kapacitor: newKapacitor});
    }).catch(() => {
      addFlashMessage({type: 'error', text: 'There was a problem updating the Kapacitor record'});
    });
  },

  updateName() {
    this.setState({newName: this.kapacitorName.value});
  },

  updateURL() {
    this.setState({newURL: this.kapacitorURL.value});
  },

  updateUsername() {
    this.setState({newUsername: this.kapacitorUser.value});
  },

  handleResetToDefaults(e) {
    e.preventDefault();
    this.setState({
      newURL: defaultKapacitorUrl,
      newName: defaultKapacitorName,
    });
  },

  render() {
    const {kapacitor, newName, newURL, newUsername} = this.state;
    // if the fields in state are defined, use them. otherwise use the defaults
    const name = newName === undefined ? kapacitor && kapacitor.name || defaultKapacitorName : newName;
    const url = newURL === undefined ? kapacitor && kapacitor.url || defaultKapacitorUrl : newURL;
    const username = newUsername === undefined ? kapacitor && kapacitor.username || '' : newUsername;


    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1>
                Configure Kapacitor
              </h1>
            </div>
          </div>
        </div>
        <div className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                <div className="panel panel-minimal">
                  <div className="panel-body">
                    <p>
                      Kapacitor is used as the monitoring and alerting agent.
                      This page will let you configure which Kapacitor to use and
                      set up alert end points like email, Slack, and others.
                    </p>
                    <hr/>
                    <h4 className="text-center">Connection Details</h4>
                    <br/>
                    <form onSubmit={this.handleKapacitorUpdate}>
                      <div>
                        <div className="form-group col-xs-12 col-sm-8 col-sm-offset-2 col-md-4 col-md-offset-2">
                          <label htmlFor="connect-string">Connection String</label>
                          <input ref={(r) => this.kapacitorURL = r} className="form-control" id="connect-string" defaultValue={defaultKapacitorUrl} value={url} onChange={this.updateURL}></input>
                        </div>
                        <div className="form-group col-xs-12 col-sm-8 col-sm-offset-2 col-md-4 col-md-offset-0">
                          <label htmlFor="name">Name</label>
                          <input ref={(r) => this.kapacitorName = r} className="form-control" id="name" defaultValue={defaultKapacitorName} value={name} onChange={this.updateName}></input>
                        </div>
                        <div className="form-group col-xs-12 col-sm-4 col-sm-offset-2 col-md-4 col-md-offset-2">
                          <label htmlFor="username">Username</label>
                          <input ref={(r) => this.kapacitorUser = r} className="form-control" id="username" value={username} onChange={this.updateUsername}></input>
                        </div>
                        <div className="form-group col-xs-12 col-sm-4 col-md-4">
                          <label htmlFor="password">Password</label>
                          <input ref={(r) => this.kapacitorPassword = r} className="form-control" id="password" type="password"></input>
                        </div>
                      </div>

                      <div className="form-group form-group-submit col-xs-12 text-center">
                        <button className="btn btn-info" onClick={this.handleResetToDefaults}>Reset to Default</button>
                        <button className="btn btn-success" type="submit">Connect Kapacitor</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                {this.renderAlertOutputs()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },

  renderAlertOutputs() {
    const {kapacitor} = this.state;
    if (kapacitor) {
      return <AlertOutputs source={this.props.source} kapacitor={kapacitor} addFlashMessage={this.props.addFlashMessage} />;
    }

    return (
      <div className="panel panel-minimal">
        <div className="panel-body">
          <h4 className="text-center">Configure Alert Endpoints</h4>
          <br/>
          <p className="text-center">Set your Kapacitor connection info to configure alerting endpoints.</p>
        </div>
      </div>
    );
  },
});

export default KapacitorPage;
