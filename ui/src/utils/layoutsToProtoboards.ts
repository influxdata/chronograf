import {getLayouts} from 'src/hosts/apis'
import _ from 'lodash'
import download from 'src/external/download.js'
import uuid from 'uuid'

// const measurementreplace = (text, measurement) =>
//   text.replace(`"${measurement}"`, measurement)

// const db = text => text.replace('":db:"', ':db:')
// const rp = text => text.replace('":rp:"', ':rp:')

const addWhere = text =>
  text +
  ' WHERE time > :dashboardTime: AND "host"=:host: GROUP BY time(:interval:)'

const modifyQueryText = text => addWhere(text)

const modifyQueries = queries => {
  const mappedQueries = queries.map(q => ({
    ...q,
    query: modifyQueryText(q.query),
  }))
  return mappedQueries
}

const modifyCells = (cells, measurement) => {
  const mappedCells = cells.map(c => {
    const omitted = _.omit(c, ['x', 'y', 'i', 'axes', 'type', 'colors'])
    return {
      ...omitted,
      measurement,
      queries: modifyQueries(c.queries),
    }
  })
  return mappedCells
}

const transformLayoutsToProtoboards = async () => {
  const {
    data: {layouts},
  } = await getLayouts()
  let apps
  apps = {}
  layouts.forEach(l => {
    if (apps[l.app]) {
      const existing = apps[l.app]
      const newCells = modifyCells(l.cells, l.measurement)

      apps[l.app] = {
        ...existing,
        cells: [...existing.cells, ...newCells],
      }
    } else {
      const newCells = modifyCells(l.cells, l.measurement)
      apps[l.app] = {app: l.app, cells: newCells}
    }
  })

  apps = _.map(apps, a => {
    const appsJSONObject = {
      id: uuid.v4(),
      meta: {
        name: a.app,
        version: '1.0',
        dashboardVersion: '1.x',
        description: descriptions[a.app],
        author: 'influxdata',
        license: 'MIT',
        icon: '',
        url: urls[a.app],
      },
      data: {
        cells: a.cells,
      },
    }
    return appsJSONObject
  })

  _.forEach(apps, a => {
    // if (a.meta.name[0] < 'm') {
    // if (a.meta.name[0] === 'm') {
    if (a.meta.name[0] > 'm') {
      console.log(a.meta.name)
      const appsJSONString = JSON.stringify(a)
      download(appsJSONString, `${a.meta.name}.json`, 'text/plain')
    }
  })
}

const descriptions = {
  apache: 'Dashboard for the telegraf input plug-in: Apache',
  consul: 'Dashboard for the telegraf input plug-in: Consul',
  docker: 'Dashboard for the telegraf input plug-in: Docker',
  elasticsearch: 'Dashboard for the telegraf input plug-in: Elasticsearch',
  haproxy: 'Dashboard for the telegraf input plug-in: HAProxy',
  iis: '',
  influxdb: 'Dashboard for the telegraf input plug-in: InfluxDB',
  kubernetes: 'Dashboard for the telegraf input plug-in: Kubernetes',
  memcached: 'Dashboard for the telegraf input plug-in: Memcached',
  mesos: 'Dashboard for the telegraf input plug-in: Mesos',
  mysql: 'Dashboard for the telegraf input plug-in: MySQL',
  mongodb: 'Dashboard for the telegraf input plug-in: MongoDB',
  nginx: 'Dashboard for the telegraf input plug-in: NGINX',
  nsq: 'Dashboard for the telegraf input plug-in: NSQ',
  phpfpm: 'Dashboard for the telegraf input plug-in: PHPfpm',
  ping: 'Dashboard for the telegraf input plug-in: Ping',
  postgresql: 'Dashboard for the telegraf input plug-in: PostgreSQL',
  rabbitmq: 'Dashboard for the telegraf input plug-in: RabbitMQ',
  redis: 'Dashboard for the telegraf input plug-in: Redis',
  riak: 'Dashboard for the telegraf input plug-in: Riak',
  system: 'Dashboard for the telegraf input plug-in: ',
  varnish: 'Dashboard for the telegraf input plug-in: Varnish',
  win_system: 'Dashboard for the telegraf input plug-in: win_perf_counters',
}

const urls = {
  apache:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/apache',
  consul:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/consul',
  docker:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/docker',
  elasticsearch:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/elasticsearch',
  haproxy:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/haproxy',
  iis: '', // TODO
  influxdb:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/influxdb',
  kubernetes:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/kubernetes',
  memcached:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/memcached',
  mesos:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/mesos',
  mongodb:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/mongodb',
  mysql:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/mysql',
  nginx:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/nginx',
  nsq: 'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/nsq',
  phpfpm:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/phpfpm',
  ping:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/ping',
  postgresql:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/postresql',
  rabbitmq:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/rabbitmq',
  redis:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/redis',
  riak:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/riak',
  system:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/system',
  varnish:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/varnish',
  win_system:
    'https://github.com/influxdata/telegraf/tree/master/plugins/inputs/win_perf_counters',
}

export default transformLayoutsToProtoboards

// Name             string `json:"name"`
// Icon             string `json:"icon,omitempty"`
// Version          string `json:"version"`
// DashboardVersion string `json:"dashboardVersion"`
// Description      string `json:"description,omitempty"`
// Author           string `json:"author,omitempty"`
// License          string `json:"license,omitempty"`
// URL              string `json:"url,omitempty"`

//  https://github.com/influxdata/chronograf/issues/4080
