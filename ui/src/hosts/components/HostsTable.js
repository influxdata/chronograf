import React, {PropTypes} from 'react';
import _ from 'lodash';

const HostsTable = React.createClass({
  propTypes: {
    hosts: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      cpu: PropTypes.string,
      load: PropTypes.string,
    })),
    source: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  },

  getInitialState() {
    return {
      searchTerm: '',
      filteredHosts: this.props.hosts,
      sortDirection: null,
    };
  },

  componentWillReceiveProps(newProps) {
    this.filterHosts(newProps.hosts, this.state.searchTerm);
  },

  filterHosts(allHosts, searchTerm) {
    const hosts = allHosts.filter((h) => h.name.search(searchTerm) !== -1);
    this.setState({searchTerm, filteredHosts: hosts});
  },

  changeSort() {
    if (this.state.sortDirection === 'asc') {
      this.setState({sortDirection: 'desc'});
    } else {
      this.setState({sortDirection: 'asc'});
    }
  },

  sort(hosts, direction) {
    switch (direction) {
      case 'asc':
        return _.sortBy(hosts, (e) => e.name);
      case 'desc':
        return _.sortBy(hosts, (e) => e.name).reverse();
      default:
        return hosts;
    }
  },

  render() {
    const hosts = this.sort(this.state.filteredHosts, this.state.sortDirection);
    const {source} = this.props;

    return (
      <div className="panel panel-minimal">
        <div className="panel-heading u-flex u-ai-center u-jc-space-between">
          <h2 className="panel-title">{this.props.hosts.length} Hosts</h2>
          <SearchBar onSearch={_.wrap(this.props.hosts, this.filterHosts)} />
        </div>
        <div className="panel-body">
          <table className="table v-center">
            <thead>
              <tr>
                <th onClick={this.changeSort} className="sortable-header">Hostname</th>
                <th className="text-center">Status</th>
                <th>CPU</th>
                <th>Load</th>
                <th>Apps</th>
              </tr>
            </thead>
            <tbody>
              {
                hosts.map(({name, cpu, load}) => {
                  return (
                    <tr key={name}>
                      <td className="monotype"><a href={`/sources/${source.id}/hosts/${name}`}>{name}</a></td>
                      <td className="text-center"><div className="table-dot dot-success"></div></td>
                      <td className="monotype">{`${cpu}%`}</td>
                      <td className="monotype">{`${load}`}</td>
                      <td className="monotype">influxdb, ntp, system</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});

const SearchBar = React.createClass({
  propTypes: {
    onSearch: PropTypes.func.isRequired,
  },

  handleChange() {
    this.props.onSearch(this.refs.searchInput.value);
  },

  render() {
    return (
      <div className="users__search-widget input-group">
        <div className="input-group-addon">
          <span className="icon search" aria-hidden="true"></span>
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Filter Hosts"
          ref="searchInput"
          onChange={this.handleChange}
        />
      </div>
    );
  },
});

export default HostsTable;
