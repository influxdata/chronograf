# Cypress tests

## How to run the tests
You have to first start a mock OAuth2 server, Chronograf, and InfluxDB Enterprise before the tests can be run.

### OAuth2 Mock server
```bash
yarn test:e2e:oauth-mock
```
The default configuration of the OAuth2 server is explained in `../../etc/oauth2-server-mock/env.sh`

### Chronograf
Chronograf must be configured with authentication against the OAuth2 mock server:

```bash
cd ../..
./etc/oauth2-server-mock/oauth-for-chronograf.sh 
# build chronograf from sources 
make
# start it (herein with a custom file-based database for e2e tests)
./chronograf -b chronograf-e2e.db
```
### InfluxDB Enteprise
InfluxDB Enterprise is required by the tests. InfluxDB installation is automated with [kind](https://kind.sigs.k8s.io/) and [helm](https://helm.sh/). Setup InfluxDB license key and start it with:

```bash
export INFLUXDB_ENTERPRISE_LICENSE_KEY=yourlicensekey
./local-chronograf-influxdb-enterprise.sh
```

... and wait, it takes a while

## Cypress tests
Run Cypress e2e tests in a headless mode using:

```bash
yarn test:e2e
```
or within a browser (Chrome) using:
```bash
yarn test:e2e:headed
```
