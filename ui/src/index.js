import React, {PropTypes} from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Router, Route, browserHistory} from 'react-router';

import App from 'src/App';
import AlertsApp from 'src/alerts';
import CheckDataNodes from 'src/CheckDataNodes';
import {HostsPage, HostPage} from 'src/hosts';
import QueriesPage from 'src/queries';
import TasksPage from 'src/tasks';
import RetentionPoliciesPage from 'src/retention_policies';
import DataExplorer from 'src/chronograf';
import DatabaseManager from 'src/database_manager';
import SignUp from 'src/sign_up';
import SelectSourcePage from 'src/select_source';
import {ClusterAccountsPage, ClusterAccountPage} from 'src/cluster_accounts';
import {RolesPageContainer, RolePageContainer} from 'src/access_control';
import NotFound from 'src/shared/components/NotFound';
import NoClusterError from 'src/shared/components/NoClusterError';
import configureStore from 'src/store/configureStore';

import 'src/style/enterprise_style/application.scss';

const {number, shape, string, bool} = PropTypes;

const defaultTimeRange = {upper: null, lower: 'now() - 15m'};
const lsTimeRange = window.localStorage.getItem('timeRange');
const parsedTimeRange = JSON.parse(lsTimeRange) || {};
const timeRange = Object.assign(defaultTimeRange, parsedTimeRange);

const store = configureStore({timeRange});
const rootNode = document.getElementById('react-root');

const HTTP_SERVER_ERROR = 500;

const Root = React.createClass({
  getInitialState() {
    return {
      me: {
        id: 1,
        name: 'MrFusion',
        email: 'foo@example.com',
        admin: true,
      },
      isFetching: false,
      hasReadPermission: false,
      clusterStatus: null,
    };
  },

  componentDidMount() {
    // meShow().then(({data: me}) => {
    //   const match = window.location.pathname.match(/\/clusters\/(\d*)/);
    //   const clusterID = match && match[1];
    //   const clusterLink = me.cluster_links.find(link => link.cluster_id === clusterID);
    //   if (clusterLink) {
    //     Promise.all([
    //       getClusterAccount(clusterID, clusterLink.cluster_user),
    //       getRoles(clusterID),
    //     ]).then(([{data: {users}}, {data: {roles}}]) => {
    //       const account = buildClusterAccounts(users, roles)[0];
    //       const canViewChronograf = hasPermission(account, VIEW_CHRONOGRAF);
    //       const hasReadPermission = hasPermission(account, READ);
    //       this.setState({
    //         me,
    //         canViewChronograf,
    //         isFetching: false,
    //         hasReadPermission,
    //       });
    //     }).catch((err) => {
    //       console.error(err); // eslint-disable-line no-console
    //       this.setState({
    //         canViewChronograf: false,
    //         isFetching: false,
    //         clusterStatus: err.response.status,
    //       });
    //     });
    //   } else {
    //     this.setState({
    //       me,
    //       isFetching: false,
    //     });
    //   }
    // }).catch((err) => {
    //   console.error(err); // eslint-disable-line no-console
    //   this.setState({
    //     isFetching: false,
    //   });
    // });
  },

  childContextTypes: {
    me: shape({
      id: number.isRequired,
      name: string.isRequired,
      email: string.isRequired,
      admin: bool.isRequired,
    }),
  },

  getChildContext() {
    return {
      me: this.state.me,
    };
  },

  hasDefaultSource(_, replace) {
    const defaultSource = JSON.parse(localStorage.getItem('defaultSource'));
    if (!!defaultSource && defaultSource.id) {
      return replace(`/sources/${defaultSource.id}/hosts`);
    }
  },

  render() {
    if (this.state.isFetching) {
      return null;
    }

    if (this.state.clusterStatus === HTTP_SERVER_ERROR) {
      return <NoClusterError />;
    }

    return (
      <Provider store={store}>
        <Router history={browserHistory}>
          <Route path="/signup/admin/:step" component={SignUp} />
          <Route path="/" component={SelectSourcePage} onEnter={this.hasDefaultSource} />
          <Route path="/sources" component={SelectSourcePage} />
          <Route path="/sources/:sourceID" component={App}>
            <Route component={CheckDataNodes}>
              <Route path="queries" component={QueriesPage} />
              <Route path="accounts" component={ClusterAccountsPage} />
              <Route path="accounts/:accountID" component={ClusterAccountPage} />
              <Route path="databases/manager/:database" component={DatabaseManager} />
              <Route path="databases/retentionpolicies/:database" component={RetentionPoliciesPage} />
              <Route path="chronograf/data_explorer" component={DataExplorer} />
              <Route path="chronograf/data_explorer/:base64ExplorerID" component={DataExplorer} />
              <Route path="roles" component={RolesPageContainer} />
              <Route path="roles/:roleSlug" component={RolePageContainer} />
              <Route path="hosts" component={HostsPage} />
              <Route path="hosts/:hostID" component={HostPage} />
              <Route path="alerts" component={AlertsApp} />
            </Route>
            <Route path="tasks" component={TasksPage} />
            <Route path="*" component={NotFound} />
          </Route>
        </Router>
      </Provider>
    );
  },
});

if (rootNode) {
  render(<Root />, rootNode);
}
