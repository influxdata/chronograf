## v1.2.0 [unreleased]

### Bug Fixes
  1. [#1074](https://github.com/influxdata/chronograf/pull/1074): Fix unexpected redirection to create sources page when deleting a source

### Features
  1. [#1092](https://github.com/influxdata/chronograf/pull/1092): Persist and render Dashboard Cell groupby queries

### UI Improvements

## v1.2.0-beta6 [2017-03-24]

### Bug Fixes
  1. [#1065](https://github.com/influxdata/chronograf/pull/1065): Add functionality to the `save` and `cancel` buttons on editable dashboards
  2. [#1069](https://github.com/influxdata/chronograf/pull/1069): Make graphs on pre-created dashboards un-editable
  3. [#1085](https://github.com/influxdata/chronograf/pull/1085): Make graphs resizable again
  4. [#1087](https://github.com/influxdata/chronograf/pull/1087): Hosts page now displays proper loading, host count, and error messages.

### Features
  1. [#1056](https://github.com/influxdata/chronograf/pull/1056): Add ability to add a dashboard cell
  2. [#1020](https://github.com/influxdata/chronograf/pull/1020): Allow users to edit cell names on dashboards
  3. [#1015](https://github.com/influxdata/chronograf/pull/1015): Add ability to edit a dashboard cell
  4. [#832](https://github.com/influxdata/chronograf/issues/832): Add a database and retention policy management page
  5. [#1035](https://github.com/influxdata/chronograf/pull/1035): Add ability to move and edit queries between raw InfluxQL mode and Query Builder mode

### UI Improvements

## v1.2.0-beta5 [2017-03-10]

### Bug Fixes
  1. [#936](https://github.com/influxdata/chronograf/pull/936): Fix leaking sockets for InfluxQL queries
  2. [#967](https://github.com/influxdata/chronograf/pull/967): Fix flash of empty graph on auto-refresh when no results were previously returned from a query
  3. [#968](https://github.com/influxdata/chronograf/issue/968): Fix wrong database used in dashboards

### Features
  1. [#993](https://github.com/influxdata/chronograf/pull/993): Add Admin page for managing users, roles, and permissions for [OSS InfluxDB](https://github.com/influxdata/influxdb) and InfluxData's [Enterprise](https://docs.influxdata.com/enterprise/v1.2/) product
  2. [#993](https://github.com/influxdata/chronograf/pull/993): Add Query Management features including the ability to view active queries and stop queries

### UI Improvements
  1. [#989](https://github.com/influxdata/chronograf/pull/989) Add a canned dashboard for mesos
  2. [#993](https://github.com/influxdata/chronograf/pull/993): Improve the multi-select dropdown
  3. [#993](https://github.com/influxdata/chronograf/pull/993): Provide better error information to users

## v1.2.0-beta4 [2017-02-24]

### Bug Fixes
  1. [#882](https://github.com/influxdata/chronograf/pull/882): Fix y-axis graph padding
  2. [#907](https://github.com/influxdata/chronograf/pull/907): Fix react-router warning
  3. [#926](https://github.com/influxdata/chronograf/pull/926): Fix Kapacitor RuleGraph display

### Features
  1. [#873](https://github.com/influxdata/chronograf/pull/873): Add [TLS](https://github.com/influxdata/chronograf/blob/master/docs/tls.md) support
  2. [#885](https://github.com/influxdata/chronograf/issues/885): Add presentation mode to the dashboard page
  3. [#891](https://github.com/influxdata/chronograf/issues/891): Make dashboard visualizations draggable
  4. [#892](https://github.com/influxdata/chronograf/issues/891): Make dashboard visualizations resizable
  5. [#893](https://github.com/influxdata/chronograf/issues/893): Persist dashboard visualization position
  6. [#922](https://github.com/influxdata/chronograf/issues/922): Additional OAuth2 support for [Heroku](https://github.com/influxdata/chronograf/blob/master/docs/auth.md#heroku) and [Google](https://github.com/influxdata/chronograf/blob/master/docs/auth.md#google)
  7. [#781](https://github.com/influxdata/chronograf/issues/781): Add global auto-refresh dropdown to all graph dashboards

### UI Improvements
  1. [#905](https://github.com/influxdata/chronograf/pull/905): Make scroll bar thumb element bigger
  2. [#917](https://github.com/influxdata/chronograf/pull/917): Simplify the sidebar
  3. [#920](https://github.com/influxdata/chronograf/pull/920): Display stacked and step plot graph types
  4. [#851](https://github.com/influxdata/chronograf/pull/851): Add configuration for [InfluxEnterprise](https://portal.influxdata.com/) meta nodes
  5. [#916](https://github.com/influxdata/chronograf/pull/916): Dynamically scale font size based on resolution

## v1.2.0-beta3 [2017-02-15]

### Bug Fixes
  1. [#879](https://github.com/influxdata/chronograf/pull/879): Fix several Kapacitor configuration page state bugs: [#875](https://github.com/influxdata/chronograf/issues/875), [#876](https://github.com/influxdata/chronograf/issues/876), [#878](https://github.com/influxdata/chronograf/issues/878)
  2. [#872](https://github.com/influxdata/chronograf/pull/872): Fix incorrect data source response

### Features
  1. [#896](https://github.com/influxdata/chronograf/pull/896) Add more docker stats

## v1.2.0-beta2 [2017-02-10]

### Bug Fixes
  1. [#865](https://github.com/influxdata/chronograf/issues/865): Support for String fields compare Kapacitor rules in Chronograf UI

### Features
  1. [#838](https://github.com/influxdata/chronograf/issues/838): Add [detail node](https://docs.influxdata.com/kapacitor/latest/nodes/alert_node/#details) to Kapacitor alerts
  2. [#847](https://github.com/influxdata/chronograf/issues/847): Enable and disable Kapacitor alerts from the alert manager page
  3. [#853](https://github.com/influxdata/chronograf/issues/853): Update builds to use yarn over npm install
  4. [#860](https://github.com/influxdata/chronograf/issues/860): Add gzip encoding and caching of static assets to server
  5. [#864](https://github.com/influxdata/chronograf/issues/864): Add support to Kapacitor rule alert configuration for:
    - HTTP
    - TCP
    - Exec
    - SMTP
    - Alerta

### UI Improvements
  1. [#822](https://github.com/influxdata/chronograf/issues/822): Simplify and improve the layout of the Data Explorer
    - The Data Explorer's intention and purpose has always been the ad hoc and ephemeral exploration of your schema and data.
      The concept of `Exploration` sessions and `Panels` betrayed this initial intention. The DE turned into a "poor man's"
      dashboarding tool. In turn, this introduced complexity in the code and the UI. In the future if I want to save, manipulate,
      and view multiple visualizations this will be done more efficiently and effectively in our dashboarding solution.

## v1.2.0-beta1 [2017-01-27]

### Bug Fixes
  1. [#788](https://github.com/influxdata/chronograf/pull/788): Fix missing fields in data explorer when using non-default retention policy
  2. [#774](https://github.com/influxdata/chronograf/issues/774): Fix gaps in layouts for hosts

### Features
  1. [#779](https://github.com/influxdata/chronograf/issues/779): Add layout for telegraf's diskio system plugin
  2. [#810](https://github.com/influxdata/chronograf/issues/810): Add layout for telegraf's net system plugin
  3. [#811](https://github.com/influxdata/chronograf/issues/811): Add layout for telegraf's procstat plugin
  4. [#737](https://github.com/influxdata/chronograf/issues/737): Add GUI for OpsGenie kapacitor alert service
  5. [#814](https://github.com/influxdata/chronograf/issues/814): Allows Chronograf to be mounted under any arbitrary URL path using the `--basepath` flag.

## v1.1.0-beta6 [2017-01-13]
### Bug Fixes
  1. [#748](https://github.com/influxdata/chronograf/pull/748): Fix missing kapacitors on source index page
  2. [#755](https://github.com/influxdata/chronograf/pull/755): Fix kapacitor basic auth proxying
  3. [#704](https://github.com/influxdata/chronograf/issues/704): Fix RPM and DEB install script and systemd unit file

### Features
  1. [#660](https://github.com/influxdata/chronograf/issues/660): Add option to accept any certificate from InfluxDB
  2. [#733](https://github.com/influxdata/chronograf/pull/733): Add optional Github organization membership checks to authentication
  3. [#564](https://github.com/influxdata/chronograf/issues/564): Add RabbitMQ pre-canned layout
  4. [#706](https://github.com/influxdata/chronograf/issues/706): Alerts on threshold where value is inside of range
  5. [#707](https://github.com/influxdata/chronograf/issues/707): Alerts on threshold where value is outside of range
  6. [#772](https://github.com/influxdata/chronograf/pull/772): Add X-Chronograf-Version header to all requests

### UI Improvements
  1. [#766](https://github.com/influxdata/chronograf/pull/766): Add click-to-insert functionality to rule message templates

## v1.1.0-beta5 [2017-01-05]

### Bug Fixes
  1. [#693](https://github.com/influxdata/chronograf/issues/693): Fix corrupted MongoDB pre-canned layout
  2. [#714](https://github.com/influxdata/chronograf/issues/714): Relative rules check data in the wrong direction
  3. [#718](https://github.com/influxdata/chronograf/issues/718): Fix bug that stopped apps from displaying

## v1.1.0-beta4 [2016-12-30]

### Features
  1. [#691](https://github.com/influxdata/chronograf/issues/691): Add server-side dashboard API
  2. [#709](https://github.com/influxdata/chronograf/pull/709): Add kapacitor range alerting to API
  3. [#672](https://github.com/influxdata/chronograf/pull/672): Added visual indicator for down hosts
  4. [#612](https://github.com/influxdata/chronograf/issues/612): Add dashboard menu

### Bug Fixes
  1. [679](https://github.com/influxdata/chronograf/issues/679): Fix version display

## v1.1.0-beta3 [2016-12-16]

### Features
  1. [#610](https://github.com/influxdata/chronograf/issues/610): Add ability to edit raw text queries in the Data Explorer

### UI Improvements
  1. [#688](https://github.com/influxdata/chronograf/issues/688): Add ability to visually distinguish queries in the Data Explorer
  1. [#618](https://github.com/influxdata/chronograf/issues/618): Add measurement name and field key to the query tab in the Data Explorer
  1. [#698](https://github.com/influxdata/chronograf/issues/698): Add color differentiation for Kapacitor alert levels
  1. [#698](https://github.com/influxdata/chronograf/issues/698): Clarify an empty Kapacitor configuration on the InfluxDB Sources page
  1. [#676](https://github.com/influxdata/chronograf/issues/676): Streamline the function selector in the Data Explorer

### Bug Fixes
  1. [#652](https://github.com/influxdata/chronograf/issues/652),[#670](https://github.com/influxdata/chronograf/issues/670): Allow text selecting in text box inputs
  2. [#679](https://github.com/influxdata/chronograf/issues/679): Add version information to the nightly builds
  3. [#675](https://github.com/influxdata/chronograf/issues/675): Fix user flow for Kapacitor connect

## v1.1.0-beta2 [2016-12-09]

### Features
  1. [#624](https://github.com/influxdata/chronograf/issues/624): Add time range selection to kapacitor alert rules
  1. Update Go to 1.7.4

### Bug Fixes
  1. [#664](https://github.com/influxdata/chronograf/issues/664): Fix Content-Type of single-page app to always be text/html
  1. [#671](https://github.com/influxdata/chronograf/issues/671): Fix multiple influxdb source freezing page

## v1.1.0-beta1 [2016-12-06]
### Layouts
  1. [#575](https://github.com/influxdata/chronograf/issues/556): Varnish Layout
  2. [#535](https://github.com/influxdata/chronograf/issues/535): Elasticsearch Layout

### Features
  1. [#565](https://github.com/influxdata/chronograf/issues/565) [#246](https://github.com/influxdata/chronograf/issues/246) [#234](https://github.com/influxdata/chronograf/issues/234) [#311](https://github.com/influxdata/chronograf/issues/311) Github Oauth login
  2. [#487](https://github.com/influxdata/chronograf/issues/487): Warn users if they are using a kapacitor instance that is configured to use an influxdb instance that does not match the current source
  3. [#597](https://github.com/influxdata/chronograf/issues/597): Filter host by series tags
  4. [#568](https://github.com/influxdata/chronograf/issues/568): [#569](https://github.com/influxdata/chronograf/issues/569): Add support for multiple y-axis, labels, and ranges
  5. [#605](https://github.com/influxdata/chronograf/issues/605): Singlestat visualization type in host view
  5. [#607](https://github.com/influxdata/chronograf/issues/607): Singlestat and line graph visualization type in host view

### Bug Fixes
  1. [#536](https://github.com/influxdata/chronograf/issues/536) Redirect the user to the kapacitor config screen if they are attempting to view or edit alerts without a configured kapacitor
  2. [#539](https://github.com/influxdata/chronograf/issues/539) Zoom works only on the first graph of a layout
  3. [#494](https://github.com/influxdata/chronograf/issues/494) Layouts should only be displayed when the measurement is present
  4. [#588](https://github.com/influxdata/chronograf/issues/588) Unable to connect to source
  5. [#586](https://github.com/influxdata/chronograf/issues/586) Allow telegraf database in non-default locations
  6. [#542](https://github.com/influxdata/chronograf/issues/542) Graphs in layouts do not show up in the order of the layout definition
  7. [#574](https://github.com/influxdata/chronograf/issues/574): Fix broken graphs on Postgres Layouts by adding aggregates
  8. [#644](https://github.com/influxdata/chronograf/pull/644): Fix bug that stopped apps from displaying
  9. [#510](https://github.com/influxdata/chronograf/issues/510): Fix connect button

## v1.1-alpha [2016-11-14]

### Release Notes

This is the initial alpha release of Chronograf 1.1.
