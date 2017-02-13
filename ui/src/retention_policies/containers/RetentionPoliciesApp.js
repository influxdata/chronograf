import React, {PropTypes} from 'react';
import _ from 'lodash';

import RetentionPoliciesHeader from '../components/RetentionPoliciesHeader';
import RetentionPoliciesList from '../components/RetentionPoliciesList';
import CreateRetentionPolicyModal from '../components/CreateRetentionPolicyModal';
import FlashMessages from 'shared/components/FlashMessages';

import {fetchShardGroups} from '../apis/metaQuery';

import {
  createRetentionPolicy,
  dropShard,
} from 'shared/apis/metaQuery';

const RetentionPoliciesApp = React.createClass({
  propTypes: {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
      }),
    }).isRequired,
    addFlashMessage: PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      // Simple list of databases
      databases: [],

      // A list of retention policy objects for the currently selected database
      retentionPolicies: [],

      /**
       * Disk usage/node locations for all shards across a database, keyed by shard ID.
       * e.g. if shard 10 was replicated across two data nodes:
       * {
       *   10: [
       *     {nodeID: 'localhost:8088', diskUsage: 12312414},
       *     {nodeID: 'localhost:8188', diskUsage: 12312414},
       *   ],
       *   ...
       * }
       */
      shardDiskUsage: {},

      // All shards across all databases, keyed by database and retention policy. e.g.:
      //   'telegraf..default': [
      //     <shard>,
      //     <shard>
      //   ]
      shards: {},

      selectedDatabase: null,
      isFetching: true,
    };
  },

  componentDidMount() {
    // fetchShardGroups(this.props.source.links.proxy).then((resp) => {
    fetchShardGroups(this.props.source).then((resp) => {
      const { groups } = resp.data;

      debugger;
      const databases = Object.keys(groups.reduce((acc, group) => {
        group.shards.forEach((shard) => {
          const { dbrp } = shard;
          const dbName = dbrp.slice(dbrp.lastIndexOf("/"), dbrp.length);
          acc[dbName] = true; // dummy value since we're using this object as a poor man's set
        });
      }));

      if (!groups.length) {
        this.props.addFlashMessage({
          text: 'No databases found',
          type: 'error',
        });

        return;
      }

      const selectedDatabase = databases[0];

      this.setState({
        databases: databases,
        selectedDatabase,
      });

      this.fetchInfoForDatabase(groups, selectedDatabase);
    }).catch((err) => {
      console.error(err); // eslint-disable-line no-console
      this.addGenericErrorMessage(err.toString());
    });
  },

  fetchInfoForDatabase(shardGroups, database) {
    debugger;
    const {retentionPolicies, shards} = rps;
    this.setState({
      shardDiskUsage,
      retentionPolicies,
      shards,
    });
  },

  addGenericErrorMessage(errMessage) {
    const defaultMsg = 'Something went wrong! Try refreshing your browser and email support@influxdata.com if the problem persists.';
    this.props.addFlashMessage({
      text: errMessage || defaultMsg,
      type: 'error',
    });
  },

  handleChooseDatabase(database) {
    this.setState({selectedDatabase: database, retentionPolicies: []});
    this.fetchInfoForDatabase(database);
  },

  handleCreateRetentionPolicy({rpName, duration, replicationFactor}) {
    const params = {
      database: this.state.selectedDatabase,
      host: this.props.source.links.proxy,
      rpName,
      duration,
      replicationFactor,
    };

    createRetentionPolicy(params).then(() => {
      this.props.addFlashMessage({
        text: 'Retention policy created successfully!',
        type: 'success',
      });
      this.fetchInfoForDatabase(this.state.selectedDatabase);
    }).catch((err) => {
      this.addGenericErrorMessage(err.toString());
    });
  },

  render() {
    if (this.state.isFetching) {
      return <div className="page-spinner" />;
    }

    const {selectedDatabase, shards, shardDiskUsage} = this.state;

    return (
      <div className="page-wrapper retention-policies">
        <RetentionPoliciesHeader
          databases={this.state.databases}
          selectedDatabase={selectedDatabase}
          onChooseDatabase={this.handleChooseDatabase}
        />
        <div className="container-fluid">
          <RetentionPoliciesList
            retentionPolicies={this.state.retentionPolicies}
            selectedDatabase={selectedDatabase}
            shards={shards}
            shardDiskUsage={shardDiskUsage}
            onDropShard={this.handleDropShard}
          />
        </div>
        <CreateRetentionPolicyModal onCreate={this.handleCreateRetentionPolicy} dataNodes={this.props.source.links.proxy} />
      </div>
    );
  },

  handleDropShard(shard) {
      const {source} = this.props;
      dropShard(source.links.proxy, shard).then(() => {
      const key = `${this.state.selectedDatabase}..${shard.retentionPolicy}`;

      const shardsForRP = this.state.shards[key];
      const nextShards = _.reject(shardsForRP, (s) => s.shardId === shard.shardId);

      const shards = Object.assign({}, this.state.shards);
      shards[key] = nextShards;

      this.props.addFlashMessage({
        text: `Dropped shard ${shard.shardId}`,
        type: 'success',
      });
      this.setState({shards});
    }).catch(() => {
      this.addGenericErrorMessage();
    });
  },
});

export default FlashMessages(RetentionPoliciesApp);
