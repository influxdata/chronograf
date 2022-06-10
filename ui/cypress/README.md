# Cypress test suite

## Dependencies
### Chronograf
To run these tests you must first start Chronograf with environmental variables that configure OAuth2. 
The easy way to do that is to export environmental variables found in chronograf/etc/oauth2-server-mock/oauth-for-chronograf.sh. (more on it [here](https://docs.influxdata.com/chronograf/v1.9/administration/managing-security/#configure-chronograf-to-use-any-oauth-20-provider))

To do that  you can simply run command
```bash
source ../../etc/oauth2-server-mock/oauth-for-chronograf.sh 
```

set the InfluxDB Enterprice license key environmental variable
```bash
export INFLUXDB_ENTERPRISE_LICENSE_KEY=yourlicensekey
```

and run.
```bash
. local-chronograf-influxdb-enterprise.sh
```

### OAuth2 Mock server
Before the tests start the OAuth2 Mock server.
```bash
yarn test:e2e:oauth-mock
```
You can change OAuth2 Mock server configuration in the chronograf/etc/oauth2-server-mock/env.sh

## Cypress tests
Run Cypress e2e tests

```bash
yarn test:e2e
```
or
```bash
yarn test:e2e:headed
```
if you wish to start Cypress in a browser (default browser is set to Chrome).
