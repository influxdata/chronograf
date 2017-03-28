import React, {PropTypes} from 'react';
import {withRouter, Link} from 'react-router';
import {getKapacitor} from 'shared/apis';
import {removeAndLoadSources} from 'src/shared/actions/sources';
import {connect} from 'react-redux';

const {
  array,
  func,
  shape,
  string,
} = PropTypes

export const ManageSources = React.createClass({
  propTypes: {
    location: shape({
      pathname: string.isRequired,
    }).isRequired,
    source: shape({
      id: string.isRequired,
      links: shape({
        proxy: string.isRequired,
        self: string.isRequired,
      }),
    }),
    sources: array,
    addFlashMessage: func,
    removeAndLoadSources: func,
  },

  getInitialState() {
    return {
      kapacitors: {},
    };
  },

  componentDidMount() {
    const updates = [];
    const kapas = {};
    this.props.sources.forEach((source) => {
      const prom = getKapacitor(source).then((kapacitor) => {
        kapas[source.id] = kapacitor;
      });
      updates.push(prom);
    });
    Promise.all(updates).then(() => {
      this.setState({kapacitors: kapas});
    });
  },

  handleDeleteSource(source) {
    const {addFlashMessage} = this.props;

    try {
      this.props.removeAndLoadSources(source)
    } catch (e) {
      addFlashMessage({type: 'error', text: 'Could not remove source from Chronograf'});
    }
  },

  render() {
    const {kapacitors} = this.state;
    const {sources} = this.props;
    const {pathname} = this.props.location;
    const numSources = sources.length;
    const sourcesTitle = `${numSources} ${numSources === 1 ? 'Source' : 'Sources'}`;

    return (
      <div className="page" id="manage-sources-page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1>InfluxDB Sources</h1>
            </div>
          </div>
        </div>
        <div className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">

                <div className="panel panel-minimal">
                  <div className="panel-heading u-flex u-ai-center u-jc-space-between">
                    <h2 className="panel-title">{sourcesTitle}</h2>
                    <Link to={`/sources/${this.props.source.id}/manage-sources/new`} className="btn btn-sm btn-primary">Add New Source</Link>
                  </div>
                  <div className="panel-body">
                    <div className="table-responsive margin-bottom-zero">
                      <table className="table v-center margin-bottom-zero">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Host</th>
                            <th>Kapacitor</th>
                            <th className="text-right"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            sources.map((source) => {
                              const kapacitorName = kapacitors[source.id] ? kapacitors[source.id].name : '';
                              return (
                                <tr key={source.id}>
                                  <td>{source.name}{source.default ? <span className="default-source-label">Default</span> : null}</td>
                                  <td className="monotype">{source.url}</td>
                                  <td>{kapacitorName ? kapacitorName : "--"}</td>
                                  <td className="text-right">
                                    <Link className="btn btn-info btn-xs" to={`${pathname}/${source.id}/edit`}><span className="icon pencil"></span></Link>
                                    <Link className="btn btn-success btn-xs" to={`/sources/${source.id}/hosts`}>Connect</Link>
                                    <button className="btn btn-danger btn-xs" onClick={() => this.handleDeleteSource(source)}><span className="icon trash"></span></button>
                                  </td>
                                </tr>
                              );
                            })
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});

function mapStateToProps(state) {
  return {
    sources: state.sources,
  };
}

export default connect(mapStateToProps, {removeAndLoadSources})(withRouter(ManageSources));
