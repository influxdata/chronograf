## v1.10.7 [2025-04-15]

### Bug Fixes

1. [#6131](https://github.com/influxdata/chronograf/pull/6131): Handle missing queryConfig in Host page queries

### Other

1. [#6129](https://github.com/influxdata/chronograf/pull/6129): Upgrade golang to 1.23.8

## v1.10.6 [2024-12-16]

### Bug Fixes

1. [#6103](https://github.com/influxdata/chronograf/pull/6103): Set active database for InfluxQL meta queries.
2. [#6105](https://github.com/influxdata/chronograf/pull/6105): Prevent dangerous InfluxQL statements from auto-execution.
3. [#6111](https://github.com/influxdata/chronograf/pull/6111): Loading Hosts page for large number of hosts.
4. [#6116](https://github.com/influxdata/chronograf/pull/6116): Showing tag values in Flux query builder connected to InfluxDB Enterprise.

### Other

1. [#6108](https://github.com/influxdata/chronograf/pull/6108): Upgrade golang to 1.22.7.

## v1.10.5 [2024-05-31]

### Other

1. [#6094](https://github.com/influxdata/chronograf/pull/6094): Upgrade golang to 1.21.10.

## v1.10.4 [2024-04-25]

### Other

1. [#6090](https://github.com/influxdata/chronograf/pull/6090): Upgrade golang to 1.21.9.

## v1.10.3 [2024-02-28]

### Features

1. [#6073](https://github.com/influxdata/chronograf/pull/6073): Possibility to specify OAuth logout endpoint to logout from OAuth Identity provider.

### Other

1. [#6074](https://github.com/influxdata/chronograf/pull/6074): Upgrade golang to 1.20.13.

## v1.10.2 [2023-10-20]

### Bug Fixes

1. [#6056](https://github.com/influxdata/chronograf/pull/6056): Fix error on typing colon
2. [#6060](https://github.com/influxdata/chronograf/pull/6060): Fix time interval in `Processor_Queue_Length` query

### Other

1. [#6063](https://github.com/influxdata/chronograf/pull/6063): Upgrade golang to 1.20.10

## v1.10.1

### Features

### Bug Fixes

1. [#6001](https://github.com/influxdata/chronograf/pull/6001): Repair UI served under BASEPATH.

### Other

1. [#6010](https://github.com/influxdata/chronograf/pull/6010): Security Updates
1. [#6021](https://github.com/influxdata/chronograf/pull/6021): Security Updates
1. [#6025](https://github.com/influxdata/chronograf/pull/6025): Security Updates
1. [#6026](https://github.com/influxdata/chronograf/pull/6026): Bump to Go 1.20
1. [#6028](https://github.com/influxdata/chronograf/pull/6028): Build releases with Go 1.20
1. [#6032](https://github.com/influxdata/chronograf/pull/6032): Upgrade golang to 1.20.4

## v1.10.0 [2022-08-23]

### Features

1. [#5904](https://github.com/influxdata/chronograf/pull/5904): Add reader role.
1. [#5921](https://github.com/influxdata/chronograf/pull/5921): Manage InfluxDB users including their database permissions.
1. [#5923](https://github.com/influxdata/chronograf/pull/5923): Manage InfluxDB roles including their database permissions.
1. [#5925](https://github.com/influxdata/chronograf/pull/5925): Improve InfluxDB user creation.
1. [#5926](https://github.com/influxdata/chronograf/pull/5926): Improve InfluxDB role creation.
1. [#5927](https://github.com/influxdata/chronograf/pull/5927): Show effective permissions on Users page.
1. [#5929](https://github.com/influxdata/chronograf/pull/5926): Add refresh button to InfluxDB Users/Roles/Databases page.
1. [#5940](https://github.com/influxdata/chronograf/pull/5940): Support InfluxDB behind proxy under subpath.
1. [#5956](https://github.com/influxdata/chronograf/pull/5956): Add InfluxDB admin tabs to user/role detail page.
1. [#5959](https://github.com/influxdata/chronograf/pull/5959): Allow to customize annotation color.
1. [#5967](https://github.com/influxdata/chronograf/pull/5967): Remember whether to start with shown annotations on Dashboard page.
1. [#5977](https://github.com/influxdata/chronograf/pull/5977): Select current value in dropdown search input.
1. [#5997](https://github.com/influxdata/chronograf/pull/5997): Simplify flux labels.
1. [#5998](https://github.com/influxdata/chronograf/pull/5998): Setup DBRP mapping automatically for a v2 connection.

### Bug Fixes

1. [#5882](https://github.com/influxdata/chronograf/pull/5882): Repair table visualization of string values.
1. [#5913](https://github.com/influxdata/chronograf/pull/5913): Improve InfluxDB Enterprise detection.
1. [#5917](https://github.com/influxdata/chronograf/pull/5917): Improve InfluxDB Enterprise user creation process.
1. [#5917](https://github.com/influxdata/chronograf/pull/5917): Avoid stale reads in communication with InfluxDB Enterprise meta nodes.
1. [#5938](https://github.com/influxdata/chronograf/pull/5938): Properly detect unsupported values in Alert Rule builder.
1. [#5965](https://github.com/influxdata/chronograf/pull/5965): Inform the user to use v2 administration.
1. [#5976](https://github.com/influxdata/chronograf/pull/5976): Make markdown cell content selectable.

### Other

1. [#5875](https://github.com/influxdata/chronograf/pull/5875): Upgrade to node 16 LTS.
1. [#5896](https://github.com/influxdata/chronograf/pull/5896): Add cypress tests with github workflows.
1. [#5898](https://github.com/influxdata/chronograf/pull/5898): Upgrade javascript dependencies.
1. [#5897](https://github.com/influxdata/chronograf/pull/5897): Upgrade golang to 1.18.
1. [#5915](https://github.com/influxdata/chronograf/pull/5915): Upgrade github.com/lestrrat-go/jwx to v2.
1. [#5933](https://github.com/influxdata/chronograf/pull/5933): Upgrade golang to 1.18.3 .
1. [#5947](https://github.com/influxdata/chronograf/pull/5947): Use stable component keys.
1. [#5990](https://github.com/influxdata/chronograf/pull/5990): Upgrade golang to 1.18.4 .
1. [#5991](https://github.com/influxdata/chronograf/pull/5991): Upgrade UI to use parcel v2.

## v1.9.4 [2022-03-22]

### Features

1. [#5852](https://github.com/influxdata/chronograf/pull/5852): Add Flux Script Builder.
1. [#5858](https://github.com/influxdata/chronograf/pull/5858): Use time range in flux Schema Explorer.
1. [#5861](https://github.com/influxdata/chronograf/pull/5861): Allow to load truncated data in Flux Script Builder.
1. [#5868](https://github.com/influxdata/chronograf/pull/5868): Move Flux Tasks to own page.
1. [#5869](https://github.com/influxdata/chronograf/pull/5869): Optimize Alert Rules API.
1. [#5871](https://github.com/influxdata/chronograf/pull/5871): Add TICKscipts page.
1. [#5872](https://github.com/influxdata/chronograf/pull/5872): Open Alert Rule Builder from a TICKscript page.
1. [#5879](https://github.com/influxdata/chronograf/pull/5879): Remove Manage Tasks page, add Alert Rules page.
1. [#5881](https://github.com/influxdata/chronograf/pull/5881): Highlight that Script Builder keys/values depend on the selected time range.
1. [#5856](https://github.com/influxdata/chronograf/pull/5856): Add alert rule options to not send alert on state recovery and send regardless of state change.
1. [#5893](https://github.com/influxdata/chronograf/pull/5893): Make aggregation function selection optional.
1. [#5894](https://github.com/influxdata/chronograf/pull/5894): Autocomplete builtin `v` object in Flux editor.
1. [#5895](https://github.com/influxdata/chronograf/pull/5895): Warn before overriding the existing Flux Editor script.

### Bug Fixes

1. [#5862](https://github.com/influxdata/chronograf/pull/5862): Respect BASE_PATH when serving API docs.
1. [#5874](https://github.com/influxdata/chronograf/pull/5874): Propagate InfluxQL errors to UI.
1. [#5878](https://github.com/influxdata/chronograf/pull/5878): Rename Flux Query to Flux Script.
1. [#5885](https://github.com/influxdata/chronograf/pull/5885): Repair time zone selector on Host page.
1. [#5886](https://github.com/influxdata/chronograf/pull/5886): Report correct chronograf version.
1. [#5888](https://github.com/influxdata/chronograf/pull/5888): Show failure reason on Queries page.
1. [#5892](https://github.com/influxdata/chronograf/pull/5892): Reorder Alerting side menu.

### Other

1. [#5851](https://github.com/influxdata/chronograf/pull/5851): Remove fixed-table-2 to resolve CVE-2022-0235.
1. [#5866](https://github.com/influxdata/chronograf/pull/5866): Replace axios by fetch.
1. [#5873](https://github.com/influxdata/chronograf/pull/5873): Upgrade react-resize-detector.

## v1.9.3 [2022-01-25]

### Bug Fixes

1. [#5843](https://github.com/influxdata/chronograf/pull/5843): Log remote URL when ping fails.
1. [#5845](https://github.com/influxdata/chronograf/pull/5845): Repair retrieval of background job results.

## v1.9.2 [2022-01-25]

### Features

1. [#5831](https://github.com/influxdata/chronograf/pull/5831): Add download button on query management page.
1. [#5836](https://github.com/influxdata/chronograf/pull/5836): Allow to rename TICKscript.
1. [#5837](https://github.com/influxdata/chronograf/pull/5837): Add status column to Queries page.

### Bug Fixes

1. [#5830](https://github.com/influxdata/chronograf/pull/5830): Repair enforcement of one organization between multiple tabs.
1. [#5836](https://github.com/influxdata/chronograf/pull/5836): Allow to save a new TICKscript.
1. [#5842](https://github.com/influxdata/chronograf/pull/5842): Configure HTTP proxy from environment variables in HTTP clients.

### Other

1. [#5824](https://github.com/influxdata/chronograf/pull/5824): Move from `gogo/protobuf` to `google.golang.org/protobuf` for wire format messages.
1. [#5825](https://github.com/influxdata/chronograf/pull/5825): Upgrade bluemonday to resolve CVE-2021-42576.

## v1.9.1 [2021-10-08]

### Bug Fixes

1. [#5784](https://github.com/influxdata/chronograf/pull/5784): Fix Safari display issues of a Single Stat.
1. [#5787](https://github.com/influxdata/chronograf/pull/5787): Upgrade bluemonday to resolve CVE-2021-29272.
1. [#5788](https://github.com/influxdata/chronograf/pull/5784): Upgrade jwt to resolve CVE-2020-26160.
1. [#5792](https://github.com/influxdata/chronograf/pull/5792): Rename arm rpms with yum-compatible names.
1. [#5796](https://github.com/influxdata/chronograf/pull/5796): Avoid useless browser history change.
1. [#5803](https://github.com/influxdata/chronograf/pull/5803): Repair time rendering in horizontal table.
1. [#5804](https://github.com/influxdata/chronograf/pull/5804): Name tickscript after a `name` task variable, when defined.
1. [#5805](https://github.com/influxdata/chronograf/pull/5805): Make template tasks read-only.
1. [#5806](https://github.com/influxdata/chronograf/pull/5806): Repair paginated retrieval of flux tasks.
1. [#5808](https://github.com/influxdata/chronograf/pull/5808): Enforce one organization between browser tabs.
1. [#5810](https://github.com/influxdata/chronograf/pull/5810): Repair calculation of flux query range duration.
1. [#5815](https://github.com/influxdata/chronograf/pull/5815): Update time range of flux queries on dashboard zoom.
1. [#5818](https://github.com/influxdata/chronograf/pull/5818): Support Firefox private mode.
1. [#5821](https://github.com/influxdata/chronograf/pull/5821): Skip missing values in line chart instead of returning zeros.

### Other

1. [#5816](https://github.com/influxdata/chronograf/pull/5816): Upgrade golang to 1.17.1.

### Features

1. [#5807](https://github.com/influxdata/chronograf/pull/5807): Distinguish template tasks in task list.

### Other

## v1.9.0 [2021-06-28]

### Features

1. [#5672](https://github.com/influxdata/chronograf/pull/5672): Allow to migrate data to ETCD over HTTPS.
1. [#5672](https://github.com/influxdata/chronograf/pull/5672): Allow to specify trusted CA certificate for ETCD connections.
1. [#5673](https://github.com/influxdata/chronograf/pull/5673): Add documentation link when 1.8 flux is not installed.
1. [#5675](https://github.com/influxdata/chronograf/pull/5675): Add ServiceNow configuration and alert UI.
1. [#5682](https://github.com/influxdata/chronograf/pull/5682): Add BigPanda configuration and alert UI.
1. [#5681](https://github.com/influxdata/chronograf/pull/5681): Allow to hide/show histogram in Log Viewer.
1. [#5687](https://github.com/influxdata/chronograf/pull/5687): Add more meta query templates to Explore UI.
1. [#5688](https://github.com/influxdata/chronograf/pull/5688): Add UI variables to flux query execution.
1. [#5697](https://github.com/influxdata/chronograf/pull/5697): Allow to define dashboard variables using flux.
1. [#5700](https://github.com/influxdata/chronograf/pull/5700): Remove HipChat alerts.
1. [#5704](https://github.com/influxdata/chronograf/pull/5704): Allow to filter fields in Query Builder UI.
1. [#5712](https://github.com/influxdata/chronograf/pull/5712): Allow to change write precission.
1. [#5710](https://github.com/influxdata/chronograf/pull/5710): Add PKCE to OAuth integrations.
1. [#5713](https://github.com/influxdata/chronograf/pull/5713): Support GitHub Enterprise in the existing GitHub OAuth integration.
1. [#5728](https://github.com/influxdata/chronograf/pull/5728): Improve InfluxDB Admin | Queries page.
1. [#5726](https://github.com/influxdata/chronograf/pull/5726): Allow to setup InfluxDB v2 connection from chronograf command-line.
1. [#5735](https://github.com/influxdata/chronograf/pull/5735): Allow to add custom auto-refresh intervals.
1. [#5737](https://github.com/influxdata/chronograf/pull/5737): Allow to send multiple queries to dashboard.
1. [#5746](https://github.com/influxdata/chronograf/pull/5746): Write to buckets when Flux tab is selected.
1. [#5740](https://github.com/influxdata/chronograf/pull/5740): Add Teams configuration and alert UI.
1. [#5752](https://github.com/influxdata/chronograf/pull/5742): Add Zenoss configuration and alert UI.
1. [#5754](https://github.com/influxdata/chronograf/pull/5754): Add macOS arm64 builds.
1. [#5767](https://github.com/influxdata/chronograf/pull/5767): Add Flux Tasks.
1. [#5771](https://github.com/influxdata/chronograf/pull/5771): Allow to test Alert handlers.

### Bug Fixes

1. [#5677](https://github.com/influxdata/chronograf/pull/5677): Open event handler configuration specified in URL hash.
1. [#5678](https://github.com/influxdata/chronograf/pull/5678): Do not log error during line visualization of meta query results.
1. [#5679](https://github.com/influxdata/chronograf/pull/5679): Dispose log stream when tickscript editor page is closed.
1. [#5680](https://github.com/influxdata/chronograf/pull/5680): Generate correct flux property expressions.
1. [#5683](https://github.com/influxdata/chronograf/pull/5683): Repair stale database list in Log Viewer.
1. [#5686](https://github.com/influxdata/chronograf/pull/5686): Exclude `_start` and `_stop` tags.
1. [#5708](https://github.com/influxdata/chronograf/pull/5708): Improve detection of server type in Connection Wizard.
1. [#5711](https://github.com/influxdata/chronograf/pull/5711): Add error handling to Alert History page.
1. [#5716](https://github.com/influxdata/chronograf/pull/5716): Do not fetch tag values when no measurement tags are available.
1. [#5722](https://github.com/influxdata/chronograf/pull/5722): Filter out roles with unknown organization reference.
1. [#5724](https://github.com/influxdata/chronograf/pull/5724): Detect actual flux support in flux proxy.
1. [#5747](https://github.com/influxdata/chronograf/pull/5747): Manage individual execution status per query.
1. [#5754](https://github.com/influxdata/chronograf/pull/5754): Add macOS ARM64 builds.
1. [#5758](https://github.com/influxdata/chronograf/pull/5758): Parse exported dashboard in a resources directory.
1. [#5757](https://github.com/influxdata/chronograf/pull/5757): Enforce unique dashboard variable names.
1. [#5769](https://github.com/influxdata/chronograf/pull/5769): Don't modify query passed to a Dashboard page using a `query` URL parameter.
1. [#5774](https://github.com/influxdata/chronograf/pull/5774): Show full DB names in TICKScript editor dropdown.
1. [#5778](https://github.com/influxdata/chronograf/pull/5778): Use docker environment variables to specify default chronograf arguments.
1. [#5777](https://github.com/influxdata/chronograf/pull/5777): Refresh flux bucket list on source change.

### Other

1. [#5685](https://github.com/influxdata/chronograf/pull/5685): Upgrade UI to TypeScript 4.2.2.
1. [#5690](https://github.com/influxdata/chronograf/pull/5690): Upgrade dependencies, use eslint for typescript.
1. [#5701](https://github.com/influxdata/chronograf/pull/5701): Fix unsafe React lifecycle functions.
1. [#5706](https://github.com/influxdata/chronograf/pull/5706): Improve communication with InfluxDB Enterprise.
1. [#5730](https://github.com/influxdata/chronograf/pull/5730): Update license of dependencies.
1. [#5750](https://github.com/influxdata/chronograf/pull/5750): Upgrade markdown renderer.
1. [#5754](https://github.com/influxdata/chronograf/pull/5754): Upgrade golang to 1.16.
1. [#5755](https://github.com/influxdata/chronograf/pull/5755): Upgrade builder to python3 to avoid python2 LTS.

### Breaking Changes

1. [#5710](https://github.com/influxdata/chronograf/pull/5710): OAuth integrations newly use OAuth PKCE (RFC7636)
to provide a more secure OAuth token exchange. Google, Azure, Octa, Auth0, Gitlab (and more) integrations already
support OAuth PKCE. PKCE enablement should have no effect on the communication with authorization servers that
don't support it yet (such as Github, Bitbucket). PKCE can be eventually turned off with `OAUTH_NO_PKCE=true`
environment variable.

## v1.8.10 [2021-02-08]

### Bug Fixes

1. [#5640](https://github.com/influxdata/chronograf/pull/5640): Repair ARM v5 build.
1. [#5641](https://github.com/influxdata/chronograf/pull/5641): Stop async executions on unmounted LogsPage.
1. [#5643](https://github.com/influxdata/chronograf/pull/5643): Support bitbucket in generic OAUTH.
1. [#5646](https://github.com/influxdata/chronograf/pull/5646): Repair dashboard import to remap also sources in variables.
1. [#5642](https://github.com/influxdata/chronograf/pull/5642): Ignore databases that cannot be read.
1. [#5648](https://github.com/influxdata/chronograf/pull/5648): Improve Send to Dashboard from Data Explorer page.
1. [#5649](https://github.com/influxdata/chronograf/pull/5649): Avoid endless networking loop in Log Viewer.
1. [#5656](https://github.com/influxdata/chronograf/pull/5656): Show timestamp with full nanosecond precision in Log Viewer.

### Features

1. [#5652](https://github.com/influxdata/chronograf/pull/5652): Allow to set active database for InfluxQL commands.

### Other

1. [#5655](https://github.com/influxdata/chronograf/pull/5655): Upgrade axios to 0.21.1.

## v1.8.9.1 [2020-12-10]

### Features

1. [#5631](https://github.com/influxdata/chronograf/pull/5631): Support flux schema explorer in InfluxDB v2 sources.
1. [#5631](https://github.com/influxdata/chronograf/pull/5631): Let user specify InfluxDB v2 authentication.
1. [#5634](https://github.com/influxdata/chronograf/pull/5634): Validate credentials before creating/updating InfluxDB sources.
1. [#5635](https://github.com/influxdata/chronograf/pull/5635): Use fully-qualified bucket names in the Flux part of Explore UI.

## v1.8.9 [2020-12-04]

### Bug Fixes

1. [#5611](https://github.com/influxdata/chronograf/pull/5611): Avoid blinking "No Results" dashboard cells upon refresh.
1. [#5613](https://github.com/influxdata/chronograf/pull/5613): Warn about unsupported query in alert rule.
1. [#5616](https://github.com/influxdata/chronograf/pull/5616): AND not-equal conditions in the generated tickscript where filter.
1. [#5618](https://github.com/influxdata/chronograf/pull/5618): Disable InfluxDB admin page if administration is not possible.
1. [#5619](https://github.com/influxdata/chronograf/pull/5619): Use token authentication against InfluxDB v2 sources.
1. [#5622](https://github.com/influxdata/chronograf/pull/5622): Avoid blank screen on Windows.
1. [#5627](https://github.com/influxdata/chronograf/pull/5627): Repair visual comparison with time variables.

### Features

1. [#5612](https://github.com/influxdata/chronograf/pull/5612): Allow to configure etcd with client certificate.
1. [#5619](https://github.com/influxdata/chronograf/pull/5619): Support flux in InfluxDB v2 sources.
1. [#5631](https://github.com/influxdata/chronograf/pull/5631): Support flux schema explorer in InfluxDB v2 sources.
1. [#5631](https://github.com/influxdata/chronograf/pull/5631): Let user specify InfluxDB v2 authentication.

### Other

1. [#5610](https://github.com/influxdata/chronograf/pull/5610): Upgrade golang to 1.15.5, node to 14 LTS.
1. [#5624](https://github.com/influxdata/chronograf/pull/5624): Repair possible millisecond differences in duration computation.
1. [#5626](https://github.com/influxdata/chronograf/pull/5626): Remove deprecated React SFC type.

## v1.8.8 [2020-11-04]

### Bug Fixes

1. [#5596](https://github.com/influxdata/chronograf/pull/5596): Show rule name from tickscript.
1. [#5597](https://github.com/influxdata/chronograf/pull/5597): Do not truncate dashboard name with lots of room.
1. [#5598](https://github.com/influxdata/chronograf/pull/5598): Repair TICKscript editor scrolling.
1. [#5600](https://github.com/influxdata/chronograf/pull/5600): Apply default timeouts in server connections.
1. [#5603](https://github.com/influxdata/chronograf/pull/5603): Respect selected time zone in range picker.
1. [#5604](https://github.com/influxdata/chronograf/pull/5604): Export CSV with a time column formatted according to selected time zone.

### Features

1. [#5595](https://github.com/influxdata/chronograf/pull/5595): Allow to select recovery action in OpsGenie2 configuration.

### Other

## v1.8.7 [2020-10-06]

### Bug Fixes

1. [#5579](https://github.com/influxdata/chronograf/pull/5579): Disable default dashboard auto refresh.
1. [#5574](https://github.com/influxdata/chronograf/pull/5574): Migrate also users.
1. [#5580](https://github.com/influxdata/chronograf/pull/5580): Add 'isPresent' filter to rule tickscript.
1. [#5582](https://github.com/influxdata/chronograf/pull/5582): Make vertical scroll bar visible when rows overflow in TableGraph.
1. [#5592](https://github.com/influxdata/chronograf/pull/5592): Upgrade papaparse to 5.3.0.

### Features

1. [#5577](https://github.com/influxdata/chronograf/pull/5577): Allow to configure HTTP basic access authentication.
1. [#5584](https://github.com/influxdata/chronograf/pull/5584): Allow to set token-prefix in Alerta configuration.
1. [#5585](https://github.com/influxdata/chronograf/pull/5585): Make session inactivity duration configurable.
1. [#5591](https://github.com/influxdata/chronograf/pull/5591): Allow to configure TLS ciphers and versions.

### Breaking Changes

1. [#5591](https://github.com/influxdata/chronograf/pull/5591): TLS1.2 is by default a minimum negotiated TLS version
   when setting up chronograf HTTPS server. If you have clients that require older TLS version, use `--tls-min-version=1.1`
   option or `TLS_MIN_VERSION=1.1` environment variable to start chronograf.

### Other

1. [#5586](https://github.com/influxdata/chronograf/pull/5586): Require well-formatted commit messages in pull request.
1. [#5578](https://github.com/influxdata/chronograf/pull/5578): Upgrade node to v12.

## v1.8.6 [2020-08-26]

### Bug Fixes

1. [#5554](https://github.com/influxdata/chronograf/pull/5554): Escape tag values in query builder.
1. [#5551](https://github.com/influxdata/chronograf/pull/5551): Sort namespaces by database and retention policy.
1. [#5556](https://github.com/influxdata/chronograf/pull/5556): Make MySQL protoboard more useful by using derivatives for counter values.
1. [#5536](https://github.com/influxdata/chronograf/pull/5536): Add HTTP security headers.
1. [#5553](https://github.com/influxdata/chronograf/pull/5553): Show all query results in table view.
1. [#5555](https://github.com/influxdata/chronograf/pull/5555): Show also boolean field/tag values in tickscript editor logs.

### Other

1. [#5560](https://github.com/influxdata/chronograf/pull/5560): Upgrade Dockerfile to use Alpine 3.12.

## v1.8.5 [2020-07-08]

### Bug Fixes

1. [#5475](https://github.com/influxdata/chronograf/pull/5475): Fix public-url generic oauth configuration issue
1. [#5512](https://github.com/influxdata/chronograf/pull/5512): Fix crash when starting Chronograf built by Go 1.14 on Windows
1. [#5513](https://github.com/influxdata/chronograf/pull/5513): Keep dashboard's table sorting stable on data refresh
1. [#5503](https://github.com/influxdata/chronograf/pull/5503): Repair tick script editor scrolling on Firefox
1. [#5506](https://github.com/influxdata/chronograf/pull/5506): Parse flux CSV results in a way to support existing dockerized 1.8.0 InfluxDB
1. [#5504](https://github.com/influxdata/chronograf/pull/5504): Support `.Time.Unix` in alert message validation
1. [#5514](https://github.com/influxdata/chronograf/pull/5514): Error when viewing flux raw data after edit
1. [#5505](https://github.com/influxdata/chronograf/pull/5505): Repair management of kapacitor rules and tick scripts
1. [#5521](https://github.com/influxdata/chronograf/pull/5521): Avoid undefined error when dashboard is not ready yet
1. [#5517](https://github.com/influxdata/chronograf/pull/5517): Fall back to point timestamp in log viewer
1. [#5516](https://github.com/influxdata/chronograf/pull/5516): Add global functions and string trimmming to alert message validation
1. [#5519](https://github.com/influxdata/chronograf/pull/5519): Merge query results with unique column names
1. [#5524](https://github.com/influxdata/chronograf/pull/5524): Avoid exiting presentation mode when zooming out
1. [#5529](https://github.com/influxdata/chronograf/pull/5529): Avoid duplication of `csv.from` in functions list

### Features

### Other

## v1.8.4 [2020-04-30]

### Bug Fixes

1. [#5467](https://github.com/influxdata/chronograf/pull/5467): Fix misaligned tables when scrolling

### Features

### Other

## v1.8.3 [2020-04-23]

### Bug Fixes

1. [#5456](https://github.com/influxdata/chronograf/pull/5456): Fixed missing `token` subcommand
1. [#5458](https://github.com/influxdata/chronograf/pull/5458): Incomplete OAuth configurations now throw errors listing missing components
1. [#5459](https://github.com/influxdata/chronograf/pull/5459): Extend OAuth JWT timeout to match cookie lifespan

### Features

1. [#5461](https://github.com/influxdata/chronograf/pull/5461): Added ability to ignore or verify custom OAuth certs

### Other

## v1.8.2 [2020-04-13]

### Bug Fixes

1. [#5442](https://github.com/influxdata/chronograf/pull/5442): Fixed table rendering bug introduced in 1.8.1

### Features

1. [#5446](https://github.com/influxdata/chronograf/pull/5446): Update to [Flux v0.65.0](https://github.com/influxdata/flux/releases/tag/v0.65.0)

### Other

## v1.8.1 [2020-04-06]

### Bug Fixes

1. [#5426](https://github.com/influxdata/chronograf/pull/5426): Update Flux functions for latest Flux version.
1. [#5429](https://github.com/influxdata/chronograf/pull/5429): Updated Table results to output formatted strings rather than as single-line values
1. [#5420](https://github.com/influxdata/chronograf/pull/5420): Handle change to news feed data structure

### Features
1. [#5400](https://github.com/influxdata/chronograf/pull/5400): Add ability to directly authenticate single superadmin user against the api

### Other

## v1.8.0 [2020-02-18]

### Bug Fixes

1. [#5345](https://github.com/influxdata/chronograf/pull/5345): Log Viewer uses a default if the mapped severity doesn't exist
1. [#5366](https://github.com/influxdata/chronograf/pull/5366): Insecure cert settings are now passed to the flux client
1. [#5368](https://github.com/influxdata/chronograf/pull/5368): Queries using `non_negative_derivative` calls now correctly use 1s
1. [#5363](https://github.com/influxdata/chronograf/pull/5363): Fix minor CORS issue for news feed

### Features

1. [#5348](https://github.com/influxdata/chronograf/pull/5348): A a query parameter can now control the dashboard auto refresh rate, `refresh`
1. [#5352](https://github.com/influxdata/chronograf/pull/5352): etcd is now able to be used as an alternate backend store
1. [#5367](https://github.com/influxdata/chronograf/pull/5367): Template variables can now select their source database
1. [#5362](https://github.com/influxdata/chronograf/pull/5362): chronoctl now supports Migrate
1. [#5308](https://github.com/influxdata/chronograf/pull/5308): The hosts page can be disabled by setting the new environment variable `HOST_PAGE_DISABLED` to `true`, or by passing in `--host-page-disabled` or `-H` flags
1. [#5380](https://github.com/influxdata/chronograf/pull/5380): OAuth logins can be redirected from the login page to OAuth IdP via flag `--redir-auth-login` or environmtent variable `REDIR_AUTH_LOGIN`
1. [#5383](https://github.com/influxdata/chronograf/pull/5383): Add support for 64-bit arm processors

### Other

1. [#5349](https://github.com/influxdata/chronograf/pull/5349): Removed migration logic for directly upgrading from Chronograf 1.3.x.

## v1.7.17 [2020-01-08]

### Bug Fixes

1. [#5340](https://github.com/influxdata/chronograf/pull/5340): Allow logging out when using Oauth

### Features

## v1.7.16 [2019-12-18]

### Bug Fixes

1. [#5265](https://github.com/influxdata/chronograf/pull/5323): Update the flux schema explorer to use v1 package
1. [#5326](https://github.com/influxdata/chronograf/pull/5326): Use a fallback label for y-axis if it's available
1. [#5334](https://github.com/influxdata/chronograf/pull/5334): Allow `:upperDashboardTime:` when generating query config
1. [#5335](https://github.com/influxdata/chronograf/pull/5335): Use better heuristic than string contains `batch` when creating tasks

### Features

## v1.7.15

### Features

1. [#5324](https://github.com/influxdata/chronograf/pull/5324): Pin to latest minor go version; make Docker build process more robust

## v1.7.15

### Bug Fixes

### Features

## v1.7.15 [2019-11-12]

### Bug Fixes

1. [#5295](https://github.com/influxdata/chronograf/pull/5295): remove optional id in create dashboard swagger
1. [#5265](https://github.com/influxdata/chronograf/pull/5265): fix github org pagination when user has > 10 orgs
1. [#5306](https://github.com/influxdata/chronograf/pull/5306): making http requests on https server results in http 400
1. [#5305](https://github.com/influxdata/chronograf/pull/5305): Upgrade to flux v0.50.2
1. [#5310](https://github.com/influxdata/chronograf/pull/5310): Update the flux functions list for Flux v0.50.2
1. [#5309](https://github.com/influxdata/chronograf/pull/5309): fix date range picker in data explorer

### Features

## v1.7.14 [2019-08-27]

### Bug Fixes

1. [#5263](https://github.com/influxdata/chronograf/pull/5263): Fix DataExplorer crashing due to empty query
1. [#5166](https://github.com/influxdata/chronograf/pull/5266): Fix styles in Kapacitor alert config page

## v1.7.13 [2019-08-20]

### Bug Fixes

1. [#5217](https://github.com/influxdata/chronograf/pull/5217): Fix scroll to row bug on table graphs
1. [#5170](https://github.com/influxdata/chronograf/pull/5170): Wrap inline commas in quotes to distinguish from csv delimiters
1. [#5225](https://github.com/influxdata/chronograf/pull/5225): Fix tickscript editor syntax coloring
1. [#5227](https://github.com/influxdata/chronograf/pull/5227): Fix Fix JWK check when using login_id
1. [#5249](https://github.com/influxdata/chronograf/pull/5249): Fix dashboard typos
1. [#5220](https://github.com/influxdata/chronograf/pull/5220): Configure papaparse to distinguish inline vs delimiter commas
1. [#5225](https://github.com/influxdata/chronograf/pull/5225): Fix TICKScript editor coloring for boolean literals
1. [#5227](https://github.com/influxdata/chronograf/pull/5227): Fix JWK signing key check
1. [#5228](https://github.com/influxdata/chronograf/pull/5228): Fix alert rule message text template parsing
1. [#5131](https://github.com/influxdata/chronograf/pull/5131): Fix erroneous query manipulation
1. [#5244](https://github.com/influxdata/chronograf/pull/5244): Fix group by database for numSeries and numMeasurement queries in canned dashboards
1. [#5248](https://github.com/influxdata/chronograf/pull/5248): Update axios and lodash dependenies with known vulnerabilities
1. [#5249](https://github.com/influxdata/chronograf/pull/5249): Fix dashboard typos in protoboard queries
1. [#5258](https://github.com/influxdata/chronograf/pull/5258): Fix repeating last command in Data Explore window when multiple tabs are open

### Features

1. [#5218](https://github.com/influxdata/chronograf/pull/5218): Add toggle for UTL and local time
1. [#5222](https://github.com/influxdata/chronograf/pull/5222): Add time zone selector to data explorer
1. [#5224](https://github.com/influxdata/chronograf/pull/5224): Add time zone toggle
1. [#5229](https://github.com/influxdata/chronograf/pull/5224): Add Login Hint and redirect to OAuth provider automatically

## v1.7.12 [2019-06-20]

### Bug Fixes

1. [#5208](https://github.com/influxdata/chronograf/pull/5208): Clarify wording of PagerDuty v1 deprecation message
1. [#5198](https://github.com/influxdata/chronograf/pull/5198): Requesting info from an unavailable source no longer causes the page to hang
1. [#5171](https://github.com/influxdata/chronograf/pull/5171): Create chronograf user before CentOS installation
1. [#5183](https://github.com/influxdata/chronograf/pull/5183): Add support for web workers in IE11
1. [#5184](https://github.com/influxdata/chronograf/pull/5184): Properly update query time bounds when zooming in on a dashboard
1. [#5139](https://github.com/influxdata/chronograf/pull/5139): Fix an issue where Flux responses weren't parsed correctly

### Features

1. [#5187](https://github.com/influxdata/chronograf/pull/5187): Allow negative numbers for configured y-axis minimums

## v1.7.11 [2019-04-23]

### Bug Fixes

1. [#5154](https://github.com/influxdata/chronograf/pull/5154): Fix fetching tag keys in flux builder

### Features

## v1.7.10 [2019-04-16]

### Bug Fixes

1. [#5110](https://github.com/influxdata/chronograf/pull/5110): Fix the input for line controls in visualization options
1. [#5149](https://github.com/influxdata/chronograf/pull/5149): Fix Cell editor visualization not using ceo time range
1. [#5148](https://github.com/influxdata/chronograf/pull/5148): Fixed an issue where imports were not working in Flux scripts

### Features

1. [#5150](https://github.com/influxdata/chronograf/pull/5150): Updated the UI to work with the latest Flux version

## v1.7.9 [2019-03-20]

### Bug Fixes

1. [#5110](https://github.com/influxdata/chronograf/pull/5110): Fix the input for line controls in visualization options.
1. [#5111](https://github.com/influxdata/chronograf/pull/5111): Stop scrollbars from covering text in flux editor
1. [#5114](https://github.com/influxdata/chronograf/pull/5114): Insert flux function near cursor in flux editor
1. [#5118](https://github.com/influxdata/chronograf/pull/5118): Fix double quoting of map template values
1. [#5107](https://github.com/influxdata/chronograf/pull/5107): Fix unhandled templates in kapacitor rules
1. [#5128](https://github.com/influxdata/chronograf/pull/5128): Fix disappearing data when scrolling a table

## v1.7.8 [2019-02-08]

### Bug Fixes

1. [#5068](https://github.com/influxdata/chronograf/pull/5068): Escape injected meta query values
1. [#5073](https://github.com/influxdata/chronograf/pull/5073): Fix out of range decimal places
1. [#5076](https://github.com/influxdata/chronograf/pull/5076): Stop raw yaxis format from getting updated to 10
1. [#5077](https://github.com/influxdata/chronograf/pull/5077): Correct autoInterval calculations
1. [#5079](https://github.com/influxdata/chronograf/pull/5079): Fix multiple organizations not showing configured kapacitors
1. [#5078](https://github.com/influxdata/chronograf/pull/5078): Fix the inability to edit kapacitor info in the onboarding wizard
1. [#5083](https://github.com/influxdata/chronograf/pull/5083): Fix the column names in the Window function example
1. [#5110](https://github.com/influxdata/chronograf/pull/5110): Fix the input for line controls in visualization options.

## v1.7.7 [2018-01-16]

### Bug Fixes

1. [#5045](https://github.com/influxdata/chronograf/pull/5045): Use JWT in enterprise for authentication in flux

## v1.7.6 [2019-01-14]

### Bug Fixes

1. [#4895](https://github.com/influxdata/chronograf/pull/4895): Properly set scroll to row for table graph
1. [#4906](https://github.com/influxdata/chronograf/pull/4906): Prevent Kapacitor URLs from being overwritten in Connection Wizard.
1. [#4862](https://github.com/influxdata/chronograf/pull/4909): Fix logs intermitently show empty on first load
1. [#5034](https://github.com/influxdata/chronograf/pull/5034): Prevent meta node URLs from being overwritten in Connection Wizard.
1. [#5035](https://github.com/influxdata/chronograf/pull/5035): Update functions list for Flux 0.12

## v1.7.5 [2018-12-14]

### Bug Fixes

1. [#4886](https://github.com/influxdata/chronograf/pull/4886): Update go, node, and alpine versions

## v1.7.4 [2018-12-12]

### Features

### Bug Fixes

1. [#4776](https://github.com/influxdata/chronograf/pull/4776): Fix flux pivot function using wrong named parameters
1. [#4814](https://github.com/influxdata/chronograf/pull/4814): Fix logs page getting stuck on scroll to top
1. [#4819](https://github.com/influxdata/chronograf/pull/4819):
   - Fix momentary display of fallback notes while dashboard is loading
   - Fix issue displaying UUIDs in table cells
1. [#4854](https://github.com/influxdata/chronograf/pull/4854): Update functions list for Flux 0.7.1
1. [#4856](https://github.com/influxdata/chronograf/pull/4856): Fix single stat graphs decimal places when using flux
1. [#4814](https://github.com/influxdata/chronograf/pull/4814): Fix logs page getting stuck on scroll to top
1. [#4819](https://github.com/influxdata/chronograf/pull/4819): Fix momentary display of fallback notes while dashboard is loading
1. [#4819](https://github.com/influxdata/chronograf/pull/4819): Fix issue displaying UUIDs in table cells
1. [#4854](https://github.com/influxdata/chronograf/pull/4854): Update functions list for Flux 0.7.1
1. [#4846](https://github.com/influxdata/chronograf/pull/4846): Fix missing data and type in refreshing graph
1. [#4861](https://github.com/influxdata/chronograf/pull/4861): Fix logs stuck in loading state
1. [#4847](https://github.com/influxdata/chronograf/pull/4847): Improve display of Flux Wizard on small screens
1. [#4863](https://github.com/influxdata/chronograf/pull/4863): Update logs histogram data on click and new search
1. [#4877](https://github.com/influxdata/chronograf/pull/4877): Fix flux editor scrollbars
1. [#4840](https://github.com/influxdata/chronograf/pull/4840): Use valid characters for sensu ids
1. [4814](https://github.com/influxdata/chronograf/pull/4814): Fix logs page getting stuck on scroll to top
1. [4819](https://github.com/influxdata/chronograf/pull/4819): Fix momentary display of fallback notes while dashboard is loading
1. [4819](https://github.com/influxdata/chronograf/pull/4819): Fix issue displaying UUIDs in table cells
1. [4854](https://github.com/influxdata/chronograf/pull/4854): Update functions list for Flux 0.7.1
1. [4846](https://github.com/influxdata/chronograf/pull/4846): Fix missing data and type in refreshing graph
1. [4861](https://github.com/influxdata/chronograf/pull/4861): Fix logs stuck in loading state
1. [4847](https://github.com/influxdata/chronograf/pull/4847): Improve display of Flux Wizard on small screens
1. [4863](https://github.com/influxdata/chronograf/pull/4863): Update logs histogram data on click and new search
1. [4872](https://github.com/influxdata/chronograf/pull/4872): Prevent cell renaming widget from pushing other header elements offscreen
1. [4877](https://github.com/influxdata/chronograf/pull/4877): Fix flux editor scrollbars
1. [4840](https://github.com/influxdata/chronograf/pull/4840): Use valid characters for sensu ids
1. [#4872](https://github.com/influxdata/chronograf/pull/4872): Prevent cell renaming widget from pushing other header elements offscreen
1. [#4877](https://github.com/influxdata/chronograf/pull/4877): Fix flux editor scrollbars
1. [#4840](https://github.com/influxdata/chronograf/pull/4840): Use valid characters for sensu ids

### UI Improvements

1. [#4809](https://github.com/influxdata/chronograf/pull/4809): Add loading spinners while fetching protoboards
1. [#4845](https://github.com/influxdata/chronograf/pull/4845): Allow Kapacitor step in Connection Configuration to be skipped
1. [#4805](https://github.com/influxdata/chronograf/pull/4805): Remove extra save options for retention policy in db creation UI

## v1.7.3 [2018-11-13]

### Bug Fixes

1. [#4786](https://github.com/influxdata/chronograf/pull/4786): Get protoboards from multistore if not able to find from ProtoboardsPath
1. [#4794](https://github.com/influxdata/chronograf/pull/4794): Handle basepath issue with missing slash
1. [#4798](https://github.com/influxdata/chronograf/pull/4798): Fix the ping pre canned dashboard
1. [#4791](https://github.com/influxdata/chronograf/pull/4791): Save fieldOptions to cells created from Data Explorer page
1. [#4806](https://github.com/influxdata/chronograf/pull/4806): Fix grouping in canned dashboard queries
1. [#4788](https://github.com/influxdata/chronograf/pull/4788): Update canned dashboard queries so they all use database and retention policy
1. [#4808](https://github.com/influxdata/chronograf/pull/4808): Remove dismiss text from and add x-to-dismiss to wizard overlay steps
1. [#4796](https://github.com/influxdata/chronograf/pull/4796): Update docker, influxdb and postresql protoboards

## v1.7.2 [2018-11-08]

### Features

## v1.7.12 [2019-06-20]

### Bug Fixes

1. [#5208](https://github.com/influxdata/chronograf/pull/5208): Clarify wording of PagerDuty v1 deprecation message
1. [#5198](https://github.com/influxdata/chronograf/pull/5198): Requesting info from an unavailable source no longer causes the page to hang
1. [#5171](https://github.com/influxdata/chronograf/pull/5171): Create chronograf user before CentOS installation
1. [#5183](https://github.com/influxdata/chronograf/pull/5183): Add support for web workers in IE11
1. [#5184](https://github.com/influxdata/chronograf/pull/5184): Properly update query time bounds when zooming in on a dashboard
1. [#5139](https://github.com/influxdata/chronograf/pull/5139): Fix an issue where Flux responses weren't parsed correctly

### Features

1. [#5187](https://github.com/influxdata/chronograf/pull/5187): Allow negative numbers for configured y-axis minimums

## v1.7.11 [2019-04-23]

### Bug Fixes

1. [#5154](https://github.com/influxdata/chronograf/pull/5154): Fix fetching tag keys in flux builder

### Features

## v1.7.10 [2019-04-16]

### Bug Fixes

1. [#5149](https://github.com/influxdata/chronograf/pull/5149): Fix Cell editor visualization not using ceo time range
1. [#5148](https://github.com/influxdata/chronograf/pull/5148): Fixed an issue where imports were not working in Flux scripts

### Features

1. [#5150](https://github.com/influxdata/chronograf/pull/5150): Updated the UI to work with the latest Flux version

## v1.7.9 [2019-03-20]

### Bug Fixes

1. [#5110](https://github.com/influxdata/chronograf/pull/5110): Fix the input for line controls in visualization options.
1. [#5111](https://github.com/influxdata/chronograf/pull/5111): Stop scrollbars from covering text in flux editor
1. [#5114](https://github.com/influxdata/chronograf/pull/5114): Insert flux function near cursor in flux editor
1. [#5118](https://github.com/influxdata/chronograf/pull/5118): Fix double quoting of map template values
1. [#5128](https://github.com/influxdata/chronograf/pull/5128): Fix disappearing data when scrolling a table

## v1.7.8 [2019-02-08]

### Bug Fixes

1. [#5068](https://github.com/influxdata/chronograf/pull/5068): Escape injected meta query values
1. [#5073](https://github.com/influxdata/chronograf/pull/5073): Fix out of range decimal places
1. [#5076](https://github.com/influxdata/chronograf/pull/5076): Stop raw yaxis format from getting updated to 10
1. [#5077](https://github.com/influxdata/chronograf/pull/5077): Correct autoInterval calculations
1. [#5079](https://github.com/influxdata/chronograf/pull/5079): Fix multiple organizations not showing configured kapacitors
1. [#5078](https://github.com/influxdata/chronograf/pull/5078): Fix the inability to edit kapacitor info in the onboarding wizard
1. [#5083](https://github.com/influxdata/chronograf/pull/5083): Fix the column names in the Window function example

### Bug Fixes

1. [#5045](https://github.com/influxdata/chronograf/pull/5045): Use JWT in enterprise for authentication in flux

## v1.7.6 [2019-01-14]

### Bug Fixes

1. [#4895](https://github.com/influxdata/chronograf/pull/4895): Properly set scroll to row for table graph
1. [#4906](https://github.com/influxdata/chronograf/pull/4906): Prevent Kapacitor URLs from being overwritten in Connection Wizard.
1. [#4862](https://github.com/influxdata/chronograf/pull/4909): Fix logs intermitently show empty on first load
1. [#5034](https://github.com/influxdata/chronograf/pull/5034): Prevent meta node URLs from being overwritten in Connection Wizard.
1. [#5035](https://github.com/influxdata/chronograf/pull/5035): Update functions list for Flux 0.12

## v1.7.5 [2018-12-14]

### Bug Fixes

1. [#4886](https://github.com/influxdata/chronograf/pull/4886): Update go, node, and alpine versions

## v1.7.4 [2018-12-12]

### Features

### Bug Fixes

1. [#4814](https://github.com/influxdata/chronograf/pull/4814): Fix logs page getting stuck on scroll to top
1. [#4819](https://github.com/influxdata/chronograf/pull/4819): Fix momentary display of fallback notes while dashboard is loading
1. [#4819](https://github.com/influxdata/chronograf/pull/4819): Fix issue displaying UUIDs in table cells
1. [#4854](https://github.com/influxdata/chronograf/pull/4854): Update functions list for Flux 0.7.1
1. [#4846](https://github.com/influxdata/chronograf/pull/4846): Fix missing data and type in refreshing graph
1. [#4861](https://github.com/influxdata/chronograf/pull/4861): Fix logs stuck in loading state
1. [#4847](https://github.com/influxdata/chronograf/pull/4847): Improve display of Flux Wizard on small screens
1. [#4863](https://github.com/influxdata/chronograf/pull/4863): Update logs histogram data on click and new search
1. [#4872](https://github.com/influxdata/chronograf/pull/4872): Prevent cell renaming widget from pushing other header elements offscreen
1. [#4877](https://github.com/influxdata/chronograf/pull/4877): Fix flux editor scrollbars
1. [#4840](https://github.com/influxdata/chronograf/pull/4840): Use valid characters for sensu ids

### UI Improvements

1. [#4809](https://github.com/influxdata/chronograf/pull/4809): Add loading spinners while fetching protoboards
1. [4845](https://github.com/influxdata/chronograf/pull/4845): Allow Kapacitor step in Connection Configuration to be skipped

## v1.7.3 [2018-11-13]

### Bug Fixes

1. [#4786](https://github.com/influxdata/chronograf/pull/4786): Get protoboards from multistore if not able to find from ProtoboardsPath
1. [#4794](https://github.com/influxdata/chronograf/pull/4794): Handle basepath issue with missing slash
1. [#4798](https://github.com/influxdata/chronograf/pull/4798): Fix the ping pre canned dashboard
1. [#4791](https://github.com/influxdata/chronograf/pull/4791): Save fieldOptions to cells created from Data Explorer page
1. [#4806](https://github.com/influxdata/chronograf/pull/4806): Fix grouping in canned dashboard queries
1. [#4788](https://github.com/influxdata/chronograf/pull/4788): Update canned dashboard queries so they all use database and retention policy
1. [#4808](https://github.com/influxdata/chronograf/pull/4808): Remove dismiss text from and add x-to-dismiss to wizard overlay steps
1. [#4796](https://github.com/influxdata/chronograf/pull/4796): Update docker, influxdb and postresql protoboards

## v1.7.2 [2018-11-08]

### Features

### UI Improvements

1. [#4809](https://github.com/influxdata/chronograf/pull/4809): Add loading spinners while fetching protoboards

## v1.7.2 [2018-11-08]

### Bug Fixes

1. [#4778](https://github.com/influxdata/chronograf/pull/4778): Remove hardcoded database/retention period from protoboards

## v1.7.1 [2018-11-07]

1. [#4809](https://github.com/influxdata/chronograf/pull/4809): Add loading spinners while fetching protoboards

## v1.7.2 [2018-11-08]

### Bug Fixes

1. [#4778](https://github.com/influxdata/chronograf/pull/4778): Remove hardcoded database/retention period from protoboards

## v1.7.1 [2018-11-07]

### Bug Fixes

1. [#4758](https://github.com/influxdata/chronograf/pull/4758): Fix empty graph on alert rule creation page
1. [#4764](https://github.com/influxdata/chronograf/pull/4764): Add protoboard environment variables to build scripts
1. [#4769](https://github.com/influxdata/chronograf/pull/4769): Show manual refresh when paused
1. [#4768](https://github.com/influxdata/chronograf/pull/4768): Update dockerfile to include protoboards
1. [#4772](https://github.com/influxdata/chronograf/pull/4772): Add protoboards enviroment variables to dockerfile
1. [#4763](https://github.com/influxdata/chronograf/pull/4763): Fix log columns not rendering
1. [#4767](https://github.com/influxdata/chronograf/pull/4767): Fix scroll loading indicator not hiding in logs
1. [#4776](https://github.com/influxdata/chronograf/pull/4776): Fix flux pivot function using wrong named parameters

1. [#4758](https://github.com/influxdata/chronograf/pull/4758): Fix empty graph on alert rule creation page
1. [#4764](https://github.com/influxdata/chronograf/pull/4764): Add protoboard environment variables to build scripts
1. [#4768](https://github.com/influxdata/chronograf/pull/4768): Update dockerfile to include protoboards
1. [#4769](https://github.com/influxdata/chronograf/pull/4769): Show manual refresh when paused
1. [#4772](https://github.com/influxdata/chronograf/pull/4772): Add protoboards enviroment variables to dockerfile
1. [#4767](https://github.com/influxdata/chronograf/pull/4767): Fix scroll loading indicator not hiding in logs
1. [#4763](https://github.com/influxdata/chronograf/pull/4763): Fix log columns not rendering

## v1.7.0 [2018-11-06]

### Features

1.  [#4217](https://github.com/influxdata/chronograf/pull/4217): Add filestore backed API for protodashboards
1.  [#4220](https://github.com/influxdata/chronograf/pull/4220): Add ability to copy expanded/untruncated log message
1.  [#4228](https://github.com/influxdata/chronograf/pull/4228): Add close button for logs pop over
1.  [#4229](https://github.com/influxdata/chronograf/pull/4229): Add button on Data Explorer to send query to dashboard cell
1.  [#4241](https://github.com/influxdata/chronograf/pull/4241): Add search attributes to log viewer
1.  [#4254](https://github.com/influxdata/chronograf/pull/4254): Add Dynamic Source option to CEO source selector
1.  [#4257](https://github.com/influxdata/chronograf/pull/4257): Introduce cell notes & note cells
1.  [#4287](https://github.com/influxdata/chronograf/pull/4287): Add time selector dropdown to CEO
1.  [#4311](https://github.com/influxdata/chronograf/pull/4311): Add Flux query editor to the Cell Editor Overlay
1.  [#4319](https://github.com/influxdata/chronograf/pull/4319): Add Flux query editor to the Data Explorer and use same UI as CEO
1.  [#4353](https://github.com/influxdata/chronograf/pull/4353): Add visualization options to the Data Explorer
1.  [#4364](https://github.com/influxdata/chronograf/pull/4364): Add ability to save a Flux query to a cell
1.  [#4390](https://github.com/influxdata/chronograf/pull/4390): Remove Flux Page
1.  [#4364](https://github.com/influxdata/chronograf/pull/4364): Add ability to save a Flux query to a cell
1.  [#4390](https://github.com/influxdata/chronograf/pull/4390): Remove Flux Page
1.  [#4389](https://github.com/influxdata/chronograf/pull/4389): Add regexp search for appname in log lines
1.  [#4403](https://github.com/influxdata/chronograf/pull/4403): Add ability to toggle between Flux/InfluxQL on dynamic source in CEO
1.  [#4404](https://github.com/influxdata/chronograf/pull/4404): Add loading status indicator to hosts page
1.  [#4422](https://github.com/influxdata/chronograf/pull/4422): Allow deep linking flux script in data explorer
1.  [#4410](https://github.com/influxdata/chronograf/pull/4410): Add ability to use line graph visualizations for flux query
1.  [#4445](https://github.com/influxdata/chronograf/pull/4445): Allow flux dashboard cells to be exported
1.  [#4449](https://github.com/influxdata/chronograf/pull/4449): Add ability to use single stat graph visualizations for flux query
1.  [#4454](https://github.com/influxdata/chronograf/pull/4454): Save log line wrap/truncate preference
1.  [#4461](https://github.com/influxdata/chronograf/pull/4461): Add ability to use table graph visualizations for flux query
1.  [#4470](https://github.com/influxdata/chronograf/pull/4470): Add option to disable gzip compression

### UI Improvements

1.  [#4227](https://github.com/influxdata/chronograf/pull/4227): Redesign Cell Editor Overlay for reuse in other parts of application
1.  [#4268](https://github.com/influxdata/chronograf/pull/4268): Clear logs after searching
1.  [#4253](https://github.com/influxdata/chronograf/pull/4253): Add search expression highlighting to log lines
1.  [#4363](https://github.com/influxdata/chronograf/pull/4363): Move log message truncation controls into logs filter bar
1.  [#4391](https://github.com/influxdata/chronograf/pull/4391): Colorize entire Single Stat cell
1.  [#4392](https://github.com/influxdata/chronograf/pull/4392): Add log filters on left side
1.  [#2265](https://github.com/influxdata/chronograf/pull/2265): Autofocus dashboard query editor
1.  [#4429](https://github.com/influxdata/chronograf/pull/4429): Fix query editor flickering on update
1.  [#4452](https://github.com/influxdata/chronograf/pull/4452): Improve log search spinner info
1.  [#4525](https://github.com/influxdata/chronograf/pull/4525): Move expanded log message copy button to top right
1.  [#4665](https://github.com/influxdata/chronograf/pull/4665): Remove shadow from note cells
1.  [#4665](https://github.com/influxdata/chronograf/pull/4665): Remove character count limit from prefix and suffix for Single Stat and Gauge cells
1.  [#4715](https://github.com/influxdata/chronograf/pull/4715): Add logs page loading spinner
1.  [#4739](https://github.com/influxdata/chronograf/pull/4739): Add button to encourage switching visualization type to Table Graph when query response is not supported by Line Graph
1.  [#4236](https://github.com/influxdata/chronograf/pull/4236): Add spinner when loading logs table rows
1.  [#4330](https://github.com/influxdata/chronograf/pull/4330): Position cloned cells adjacent to target cell
1.  [#4433](https://github.com/influxdata/chronograf/pull/4433): Add metaquery template generator button to Explorer and Cell Editor
1.  [#4436](https://github.com/influxdata/chronograf/pull/4436): Automatically scroll to the current measurement in the explorer
1.  [#4659](https://github.com/influxdata/chronograf/pull/4659): Simplify Flux explorer tree and improve searching
1.  [#4744](https://github.com/influxdata/chronograf/pull/4744): Update logs page to show missing syslog message.
1.  [#4745](https://github.com/influxdata/chronograf/pull/4745): Fix dashboard link text casing changing quick select sort order

### Bug Fixes

1.  [#4272](https://github.com/influxdata/chronograf/pull/4272): Fix logs loading description not displaying
1.  [#4363](https://github.com/influxdata/chronograf/pull/4363): Position expanded log messages above logs table
1.  [#4272](https://github.com/influxdata/chronograf/pull/4272): Fix logs loading description not displaying
1.  [#4363](https://github.com/influxdata/chronograf/pull/4363): Position expanded log messages above logs table
1.  [#4388](https://github.com/influxdata/chronograf/pull/4388): Fix logs to progressively load results and provide feedback on search
1.  [#4408](https://github.com/influxdata/chronograf/pull/4408): Render null data point values in Alerts Table as mdashes
1.  [#4466](https://github.com/influxdata/chronograf/pull/4466): Maintain focus on Flux Editor text area when adding nodes via code
1.  [#4479](https://github.com/influxdata/chronograf/pull/4479): Add validation to Alert Rule messages
1.  [#4599](https://github.com/influxdata/chronograf/pull/4599): Fix search results updating race condition
1.  [#4605](https://github.com/influxdata/chronograf/pull/4605): Fix vertical stuck vertical scroll in firefox
1.  [#4612](https://github.com/influxdata/chronograf/pull/4612): Fix issue with disappearing alias'
1.  [#4621](https://github.com/influxdata/chronograf/pull/4621): Fix log viewer message expansion
1.  [#4640](https://github.com/influxdata/chronograf/pull/4640): Fix missing horizontal scrollbar
1.  [#4645](https://github.com/influxdata/chronograf/pull/4645): Add hostname to log viewer

## v1.6.2 [2018-09-06]

### UI Improvements

1.  [#4225](https://github.com/influxdata/chronograf/pull/4225): Make infinite scroll UX in Log Viewer more crisp by decreasing results queried for at a time

### Bug Fixes

1.  [#4231](https://github.com/influxdata/chronograf/pull/4231): Fix notifying user to press ESC to exit presentation mode
1.  [#4234](https://github.com/influxdata/chronograf/pull/4234): Fix persisting whether or not template variable control bar is open
1.  [#4235](https://github.com/influxdata/chronograf/pull/4235): Fix Submit Query button in Data Explorer to correctly return results

## v1.6.1 [2018-08-02]

### Features

1.  [#4033](https://github.com/influxdata/chronograf/pull/4033): Include sources id, links, and names in dashboard export
1.  [#4068](https://github.com/influxdata/chronograf/pull/4068): Add ability to map sources when importing dashboard
1.  [#4144](https://github.com/influxdata/chronograf/pull/4144): Create onboarding wizard for adding source and kapacitor connections
1.  [#4208](https://github.com/influxdata/chronograf/pull/4208): Add a duration to the show series and tag values on host page

### UI Improvements

1.  [#4009](https://github.com/influxdata/chronograf/pull/4009): Make it to get mouse into hover legend
1.  [#4213](https://github.com/influxdata/chronograf/pull/4213): Replace logs play/pause toggle with single button

### Bug Fixes

1.  [#3976](https://github.com/influxdata/chronograf/pull/3976): Ensure text template variables reflect query parameters
1.  [#3976](https://github.com/influxdata/chronograf/pull/3976): Enable using a new, blank text template variable in a query
1.  [#3976](https://github.com/influxdata/chronograf/pull/3976): Ensure cells with broken queries display “No Data”
1.  [#3978](https://github.com/influxdata/chronograf/pull/3978): Fix use of template variables within InfluxQL regexes
1.  [#3994](https://github.com/influxdata/chronograf/pull/3994): Pressing play on log viewer goes to now
1.  [#4008](https://github.com/influxdata/chronograf/pull/4008): Fix display of log viewer histogram when a basepath is enabled
1.  [#4038](https://github.com/influxdata/chronograf/pull/4038): Fix crosshairs and hover legend display in Alert Rule visualization
1.  [#4067](https://github.com/influxdata/chronograf/pull/4067): Size loading spinners based on height of their container

## v1.6.0 [2018-06-18]

### Features

1.  [#3522](https://github.com/influxdata/chronograf/pull/3522): Add support for Template Variables in Cell Titles
1.  [#3559](https://github.com/influxdata/chronograf/pull/3559): Add ability to export and import dashboards
1.  [#3556](https://github.com/influxdata/chronograf/pull/3556): Add ability to override template variables and time ranges via URL query
1.  [#3814](https://github.com/influxdata/chronograf/pull/3814): Add pprof routes to chronograf server
1.  [#3806](https://github.com/influxdata/chronograf/pull/3806): Add API to get/update Log Viewer UI config
1.  [#3896](https://github.com/influxdata/chronograf/pull/3896): Consume new Log Viewer config API in client to allow user to configure log viewer UI for their organization
1.  [#3842](https://github.com/influxdata/chronograf/pull/3842): Add V2 Cells API
1.  [#3947](https://github.com/influxdata/chronograf/pull/3947): Add V2 Dashboard API

### UI Improvements

1.  [#3474](https://github.com/influxdata/chronograf/pull/3474): Sort task table on Manage Alert page alphabetically
1.  [#3590](https://github.com/influxdata/chronograf/pull/3590): Redesign icons in side navigation
1.  [#3696](https://github.com/influxdata/chronograf/pull/3696): Add ability to delete entire queries in Flux Editor
1.  [#3671](https://github.com/influxdata/chronograf/pull/3671): Remove Snip functionality in hover legend
1.  [#3659](https://github.com/influxdata/chronograf/pull/3659): Upgrade Data Explorer query text field with syntax highlighting and partial multi-line support
1.  [#3663](https://github.com/influxdata/chronograf/pull/3663): Truncate message preview in Alert Rules table
1.  [#3770](https://github.com/influxdata/chronograf/pull/3770): Improve performance of graph crosshairs
1.  [#3790](https://github.com/influxdata/chronograf/pull/3790): Hide dashboard cell menu until mouse over cell
1.  [#3803](https://github.com/influxdata/chronograf/pull/3803): Auto-Scale single-stat text to match cell dimensions

### Bug Fixes

1.  [#3527](https://github.com/influxdata/chronograf/pull/3527): Ensure cell queries use constraints from TimeSelector
1.  [#3573](https://github.com/influxdata/chronograf/pull/3573): Fix Gauge color selection bug
1.  [#3649](https://github.com/influxdata/chronograf/pull/3649): Fix erroneous icons in Date Picker widget
1.  [#3697](https://github.com/influxdata/chronograf/pull/3697): Fix allowing hyphens in basepath
1.  [#3698](https://github.com/influxdata/chronograf/pull/3698): Fix error in cell when tempVar returns no values
1.  [#3733](https://github.com/influxdata/chronograf/pull/3733): Change arrows in table columns so that ascending sort points up and descending points down
1.  [#3751](https://github.com/influxdata/chronograf/pull/3751): Fix crosshairs moving passed the edges of graphs
1.  [#3759](https://github.com/influxdata/chronograf/pull/3759): Change y-axis options to have valid defaults
1.  [#3793](https://github.com/influxdata/chronograf/pull/3793): Stop making requests for old sources after changing sources
1.  [#3888](https://github.com/influxdata/chronograf/pull/3888): Fix health check status code creating firefox error
1.  [#3951](https://github.com/influxdata/chronograf/pull/3951): Change decimal places to enforce 2 places by default in cells

## v1.5.0.0 [2018-05-15-RC]

### Features

1.  [#3080](https://github.com/influxdata/chronograf/pull/3080): Add table graph as a visualization option
1.  [#3233](https://github.com/influxdata/chronograf/pull/3233): Add default retention policy field as option in source configuration for use in querying hosts from Host List page & Host pages
1.  [#3290](https://github.com/influxdata/chronograf/pull/3290): Add support for PagerDuty v2 in UI
1.  [#3369](https://github.com/influxdata/chronograf/pull/3369): Add support for OpsGenie v2 in UI
1.  [#3386](https://github.com/influxdata/chronograf/pull/3386): Add support for Kafka in UI to configure and create alert handlers
1.  [#3416](https://github.com/influxdata/chronograf/pull/3416): Allow kapacitor services to be disabled
1.  [#3416](https://github.com/influxdata/chronograf/pull/3416): Add support for disabling kapacitor services
1.  [#3465](https://github.com/influxdata/chronograf/pull/3465): Add support for multiple slack configurations in the UI
1.  [#3491](https://github.com/influxdata/chronograf/pull/3491): Upgrade kapacitor client to 1.5
1.  [#3490](https://github.com/influxdata/chronograf/pull/3490): Add support for multiple kafka configurations in the UI

### UI Improvements

1.  [#3204](https://github.com/influxdata/chronograf/pull/3204): Notify user when a dashboard cell is added, removed, or cloned
1.  [#3215](https://github.com/influxdata/chronograf/pull/3215): Fix Template Variables Control Bar to top of dashboard page
1.  [#3214](https://github.com/influxdata/chronograf/pull/3214): Remove extra click when creating dashboard cell
1.  [#3256](https://github.com/influxdata/chronograf/pull/3256): Reduce font sizes in dashboards for increased space efficiency
1.  [#3320](https://github.com/influxdata/chronograf/pull/3320): Add overlay animation to Template Variables Manager
1.  [#3245](https://github.com/influxdata/chronograf/pull/3245): Display 'no results' on cells without results
1.  [#3354](https://github.com/influxdata/chronograf/pull/3354): Disable template variables for non editing users
1.  [#3353](https://github.com/influxdata/chronograf/pull/3353): YAxisLabels in Dashboard Graph Builder not showing until graph is redrawn
1.  [#3378](https://github.com/influxdata/chronograf/pull/3378): Ensure table graphs have a consistent ux between chrome and firefox
1.  [#3401](https://github.com/influxdata/chronograf/pull/3401): Change AutoRefresh interval to paused
1.  [#3404](https://github.com/influxdata/chronograf/pull/3404): Get cloned cell name for notification from cloned cell generator function
1.  [#3461](https://github.com/influxdata/chronograf/pull/3461): Improve load time for host pages
1.  [#3423](https://github.com/influxdata/chronograf/pull/3423): Show kapacitor batch point info in log panel

### Bug Fixes

1.  [#3252](https://github.com/influxdata/chronograf/pull/3252): Allow user to select tickscript editor with mouseclick
1.  [#3279](https://github.com/influxdata/chronograf/pull/3279): Change color when value is equal to or greater than threshold value
1.  [#3281](https://github.com/influxdata/chronograf/pull/3281): Fix base path for kapacitor logs
1.  [#3284](https://github.com/influxdata/chronograf/pull/3284): Fix logout when using basepath & simplify basepath usage (deprecates `PREFIX_ROUTES`)
1.  [#3349](https://github.com/influxdata/chronograf/pull/3349): Fix graphs in alert rule builder for queries that include groupby
1.  [#3345](https://github.com/influxdata/chronograf/pull/3345): Fix auto not showing in the group by dropdown and explorer getting disconnected
1.  [#3353](https://github.com/influxdata/chronograf/pull/3353): Display y-axis label on initial graph load
1.  [#3352](https://github.com/influxdata/chronograf/pull/3352): Fix not being able to change the source in the CEO display
1.  [#3357](https://github.com/influxdata/chronograf/pull/3357): Fix only the selected template variable value getting loaded
1.  [#3389](https://github.com/influxdata/chronograf/pull/3389): Fix Generic OAuth bug for GitHub Enterprise where the principal was incorrectly being checked for email being Primary and Verified
1.  [#3402](https://github.com/influxdata/chronograf/pull/3402): Fix missing icons when using basepath
1.  [#3412](https://github.com/influxdata/chronograf/pull/3412): Limit max-width of TICKScript editor.
1.  [#3166](https://github.com/influxdata/chronograf/pull/3166): Fixes naming of new TICKScripts
1.  [#3412](https://github.com/influxdata/chronograf/pull/3412): Limit max-width of TICKScript editor
1.  [#3166](https://github.com/influxdata/chronograf/pull/3166): Fix naming of new TICKScripts
1.  [#3449](https://github.com/influxdata/chronograf/pull/3449): Fix data explorer query error reporting regression
1.  [#3412](https://github.com/influxdata/chronograf/pull/3412): Limit max-width of TICKScript editor.
1.  [#3166](https://github.com/influxdata/chronograf/pull/3166): Fixes naming of new TICKScripts
1.  [#3449](https://github.com/influxdata/chronograf/pull/3449): Fixes data explorer query error reporting regression
1.  [#3453](https://github.com/influxdata/chronograf/pull/3453): Fix Kapacitor Logs fetch regression
1.  [#3500](https://github.com/influxdata/chronograf/pull/3500): Fix switching sources for a dashboard cell

## v1.4.4.1 [2018-04-16]

### Bug Fixes

1.  [#3211](https://github.com/influxdata/chronograf/pull/3211): Snapshot all db struct types in migration files

## v1.4.4.0 [2018-04-13]

### Features

1.  [#2526](https://github.com/influxdata/chronograf/pull/2526): Add support for RS256/JWKS verification, support for id_token parsing (as in ADFS)
1.  [#3060](https://github.com/influxdata/chronograf/pull/3060): Add ability to set a color palette for Line, Stacked, Step-Plot, and Bar graphs
1.  [#3103](https://github.com/influxdata/chronograf/pull/3103): Add ability to clone dashboards
1.  [#3184](https://github.com/influxdata/chronograf/pull/3184): Add ability to clone cells
1.  [#3080](https://github.com/influxdata/chronograf/pull/3080): Add tabular data visualization option with features
1.  [#3120](https://github.com/influxdata/chronograf/pull/3120): Change :interval: to represent a raw influxql duration value
1.  [#2832](https://github.com/influxdata/chronograf/pull/2832): Add paginated measurements API to server
1.  [#3148](https://github.com/influxdata/chronograf/pull/3148): Data explorer measurements can be toggled open

### UI Improvements

1.  [#3088](https://github.com/influxdata/chronograf/pull/3088): New dashboard cells appear at bottom of layout and assume the size of the most common cell
1.  [#3096](https://github.com/influxdata/chronograf/pull/3096): Standardize delete confirmation interactions
1.  [#3096](https://github.com/influxdata/chronograf/pull/3096): Standardize save & cancel interactions
1.  [#3116](https://github.com/influxdata/chronograf/pull/3116): Improve cell renaming

### Bug Fixes

1.  [#3094](https://github.com/influxdata/chronograf/pull/3094): Always save template variables on first edit
1.  [#3104](https://github.com/influxdata/chronograf/pull/3104): Query annotations at auto-refresh interval
1.  [#3109](https://github.com/influxdata/chronograf/pull/3109): Display link to configure Kapacitor on Alerts Page if no configured kapacitor.
1.  [#3111](https://github.com/influxdata/chronograf/pull/3111): Fix saving of new TICKscripts
1.  [#3130](https://github.com/influxdata/chronograf/pull/3130): Fix appearance of cell Y-Axis titles
1.  [#3129](https://github.com/influxdata/chronograf/pull/3129): Only add stateChangesOnly to new rules
1.  [#3131](https://github.com/influxdata/chronograf/pull/3131): Fix 500s when deleting organizations
1.  [#3137](https://github.com/influxdata/chronograf/pull/3137): Fixes issues with providing regexp in query
1.  [#3144](https://github.com/influxdata/chronograf/pull/3144): Ensure correct basepath prefix in URL pathname when passing InfluxQL query param to Data Explorer
1.  [#3128](https://github.com/influxdata/chronograf/pull/3128): Fix type error bug in Kapacitor Alert Config page and persist deleting of team and recipient in OpsGenieConfig
1.  [#3149](https://github.com/influxdata/chronograf/pull/3149): Fixes errors caused by switching query tabs in CEO
1.  [#3162](https://github.com/influxdata/chronograf/pull/3162): Only send threshold value to parent on blur
1.  [#3168](https://github.com/influxdata/chronograf/pull/3168): Require that emails on GitHub & Generic OAuth2 principals be verified & primary, if those fields are provided
1.  [#3182](https://github.com/influxdata/chronograf/pull/3182): Send notification when rp creation returns a failure
1.  [#3181](https://github.com/influxdata/chronograf/pull/3181): Show valid time in custom time range when now is selected
1.  [#3179](https://github.com/influxdata/chronograf/pull/3179): Default to zero for gauges
1.  [#3237](https://github.com/influxdata/chronograf/pull/3237): Fixes now() time parsing when requesting annotations

## v1.4.3.1 [2018-04-02]

### Bug Fixes

1.  [#3107](https://github.com/influxdata/chronograf/pull/3107): Fixes template variable editing not allowing saving
1.  [#3094](https://github.com/influxdata/chronograf/pull/3094): Save template variables on first edit
1.  [#3101](https://github.com/influxdata/chronograf/pull/3101): Fix template variables not loading all values

## v1.4.3.0 [2018-03-28]

### Features

1.  [#2973](https://github.com/influxdata/chronograf/pull/2973): Add unsafe SSL to Kapacitor UI configuration
1.  [#3047](https://github.com/influxdata/chronograf/pull/3047): Add server flag to grant SuperAdmin status to users authenticating from a specific Auth0 Organization

### UI Improvements

1.  [#2910](https://github.com/influxdata/chronograf/pull/2910): Redesign system notifications

### Bug Fixes

1.  [#2911](https://github.com/influxdata/chronograf/pull/2911): Fix Heroku OAuth
1.  [#2953](https://github.com/influxdata/chronograf/pull/2953): Fix error reporting in DataExplorer
1.  [#2947](https://github.com/influxdata/chronograf/pull/2947): Fix Okta oauth2 provider support
1.  [#2866](https://github.com/influxdata/chronograf/pull/2866): Change hover text on delete mappings confirmation button to 'Delete'
1.  [#2919](https://github.com/influxdata/chronograf/pull/2919): Automatically add graph type 'line' to any graph missing a type
1.  [#2970](https://github.com/influxdata/chronograf/pull/2970): Fix hanging browser on docker host dashboard
1.  [#3006](https://github.com/influxdata/chronograf/pull/3006): Fix Kapacitor Rules task enabled checkboxes to only toggle exactly as clicked
1.  [#3048](https://github.com/influxdata/chronograf/pull/3048): Prevent Multi-Select Dropdown in InfluxDB Admin Users and Roles tabs from losing selection state
1.  [#3073](https://github.com/influxdata/chronograf/pull/3073): Fix Delete button in All Users admin page
1.  [#3068](https://github.com/influxdata/chronograf/pull/3068): Fix intermittent missing fill from graphs
1.  [#3087](https://github.com/influxdata/chronograf/pull/3087): Exit annotation edit mode when user navigates away from dashboard
1.  [#3079](https://github.com/influxdata/chronograf/pull/3082): Support custom time range in annotations api wrapper
1.  [#3068](https://github.com/influxdata/chronograf/pull/3068): Fix intermittent missing fill from graphs
1.  [#3079](https://github.com/influxdata/chronograf/pull/3082): Support custom time range in annotations api wrapper
1.  [#3087](https://github.com/influxdata/chronograf/pull/3087): Exit annotation edit mode when user navigates away from dashboard
1.  [#3073](https://github.com/influxdata/chronograf/pull/3073): Fix Delete button in All Users admin page

## v1.4.2.3 [2018-03-08]

## v1.4.2.2 [2018-03-07]

### Bug Fixes

1.  [#2859](https://github.com/influxdata/chronograf/pull/2859): Enable Mappings save button when valid
1.  [#2933](https://github.com/influxdata/chronograf/pull/2933): Include url in Kapacitor connection creation requests

## v1.4.2.1 [2018-02-28]

### Features

1.  [#2837](https://github.com/influxdata/chronograf/pull/2837): Prevent execution of queries in cells that are not in view on the dashboard page
1.  [#2829](https://github.com/influxdata/chronograf/pull/2829): Add an optional persistent legend which can toggle series visibility to dashboard cells
1.  [#2846](https://github.com/influxdata/chronograf/pull/2846): Allow user to annotate graphs via UI or API

### UI Improvements

1.  [#2848](https://github.com/influxdata/chronograf/pull/2848): Add ability to set a prefix and suffix on Single Stat and Gauge cell types
1.  [#2831](https://github.com/influxdata/chronograf/pull/2831): Rename 'Create Alerts' page to 'Manage Tasks'; Redesign page to improve clarity of purpose

### Bug Fixes

1.  [#2821](https://github.com/influxdata/chronograf/pull/2821): Save only selected template variable values into dashboards for non csv template variables
1.  [#2842](https://github.com/influxdata/chronograf/pull/2842): Use Generic APIKey for Oauth2 group lookup
1.  [#2850](https://github.com/influxdata/chronograf/pull/2850): Fix bug in which resizing any cell in a dashboard causes a Gauge cell to resize
1.  [#2886](https://github.com/influxdata/chronograf/pull/2886): Don't sort Single Stat & Gauge thresholds when editing threshold values
1.  [#2851](https://github.com/influxdata/chronograf/pull/2851): Maintain y axis labels in dashboard cells
1.  [#2819](https://github.com/influxdata/chronograf/pull/2819): Deprecate --new-sources in CLI

## v1.4.1.3 [2018-02-14]

### Bug Fixes

1.  [#2818](https://github.com/influxdata/chronograf/pull/2818): Allow self-signed certificates for Enterprise InfluxDB Meta nodes

## v1.4.1.2 [2018-02-13]

### Bug Fixes

1.  [9321336](https://github.com/influxdata/chronograf/commit/9321336): Respect basepath when fetching server api routes
1.  [#2812](https://github.com/influxdata/chronograf/pull/2812): Set default tempVar :interval: with data explorer csv download call.
1.  [#2811](https://github.com/influxdata/chronograf/pull/2811): Display series with value of 0 in a cell legend

## v1.4.1.1 [2018-02-12]

### Features

1.  [#2409](https://github.com/influxdata/chronograf/pull/2409): Allow multiple event handlers per rule
1.  [#2709](https://github.com/influxdata/chronograf/pull/2709): Add "send test alert" button to test kapacitor alert configurations
1.  [#2708](https://github.com/influxdata/chronograf/pull/2708): Link to kapacitor config panel from alert rule builder
1.  [#2722](https://github.com/influxdata/chronograf/pull/2722): Add auto refresh widget to hosts list page
1.  [#2784](https://github.com/influxdata/chronograf/pull/2784): Update go from 1.9.3 to 1.9.4
1.  [#2765](https://github.com/influxdata/chronograf/pull/2765): Update to go 1.9.3 and node 6.12.3 for releases
1.  [#2777](https://github.com/influxdata/chronograf/pull/2777): Allow user to delete themselves
1.  [#2703](https://github.com/influxdata/chronograf/pull/2703): Add All Users page, visible only to super admins
1.  [#2781](https://github.com/influxdata/chronograf/pull/2781): Introduce chronoctl binary for user CRUD operations
1.  [#2699](https://github.com/influxdata/chronograf/pull/2699): Introduce Mappings to allow control over new user organization assignments

### UI Improvements

1.  [#2698](https://github.com/influxdata/chronograf/pull/2698): Clarify terminology surrounding InfluxDB & Kapacitor connections
1.  [#2746](https://github.com/influxdata/chronograf/pull/2746): Separate saving TICKscript from exiting editor page
1.  [#2774](https://github.com/influxdata/chronograf/pull/2774): Enable Save (⌘ + Enter) and Cancel (Escape) hotkeys in Cell Editor Overlay
1.  [#2788](https://github.com/influxdata/chronograf/pull/2788): Enable customization of Single Stat "Base Color"

### Bug Fixes

1.  [#2684](https://github.com/influxdata/chronograf/pull/2684): Fix TICKscript Sensu alerts when no group by tags selected
1.  [#2756](https://github.com/influxdata/chronograf/pull/2756): Display 200 most-recent TICKscript log messages; prevent overlapping
1.  [#2757](https://github.com/influxdata/chronograf/pull/2757): Add "TO" to kapacitor SMTP config; improve config update error messages
1.  [#2761](https://github.com/influxdata/chronograf/pull/2761): Remove cli options from sysvinit service file
1.  [#2735](https://github.com/influxdata/chronograf/pull/2735): Remove cli options from systemd service file
1.  [#2788](https://github.com/influxdata/chronograf/pull/2788): Fix disappearance of text in Single Stat graphs during editing
1.  [#2780](https://github.com/influxdata/chronograf/pull/2780): Redirect to Alerts page after saving Alert Rule

## v1.4.0.1 [2018-1-9]

### Features

1.  [#2690](https://github.com/influxdata/chronograf/pull/2690): Add separate CLI flag for canned sources, kapacitors, dashboards, and organizations
1.  [#2672](https://github.com/influxdata/chronograf/pull/2672): Add telegraf interval configuration

### Bug Fixes

1.  [#2689](https://github.com/influxdata/chronograf/pull/2689): Allow insecure (self-signed) certificates for kapacitor and influxdb
1.  [#2664](https://github.com/influxdata/chronograf/pull/2664): Fix positioning of custom time indicator

## v1.4.0.0 [2017-12-22]

### UI Improvements

1.  [#2652](https://github.com/influxdata/chronograf/pull/2652): Add page header with instructional copy when adding initial source for consistency and clearer UX

### Bug Fixes

1.  [#2652](https://github.com/influxdata/chronograf/pull/2652): Make page render successfully when attempting to edit a source
1.  [#2664](https://github.com/influxdata/chronograf/pull/2664): Fix CustomTimeIndicator positioning
1.  [#2687](https://github.com/influxdata/chronograf/pull/2687): Remove series with "no value" from legend

## v1.4.0.0-rc2 [2017-12-21]

### UI Improvements

1.  [#2632](https://github.com/influxdata/chronograf/pull/2632): Tell user which organization they switched into and what role they have whenever they switch, including on Source Page

### Bug Fixes

1.  [#2639](https://github.com/influxdata/chronograf/pull/2639): Prevent SuperAdmin from modifying their own status
1.  [#2632](https://github.com/influxdata/chronograf/pull/2632): Give SuperAdmin DefaultRole when switching to organization where they have no role
1.  [#2642](https://github.com/influxdata/chronograf/pull/2642): Fix DE query config on first run

## v1.4.0.0-rc1 [2017-12-19]

### Features

1.  [#2593](https://github.com/influxdata/chronograf/pull/2593): Add option to use files for dashboards, organizations, data sources, and kapacitors
1.  [#2604](https://github.com/influxdata/chronograf/pull/2604): After chronograf version upgrade, backup database is created in ./backups

### UI Improvements

1.  [#2492](https://github.com/influxdata/chronograf/pull/2492): Cleanup style on login page with multiple OAuth2 providers

### Bug Fixes

1.  [#2502](https://github.com/influxdata/chronograf/pull/2502): Fix stale source data after updating or creating
1.  [#2616](https://github.com/influxdata/chronograf/pull/2616): Fix cell editing so query data choices are kept when updating a cell
1.  [#2612](https://github.com/influxdata/chronograf/pull/2612): Allow days as a valid duration value

## v1.4.0.0-beta2 [2017-12-14]

### UI Improvements

1.  [#2502](https://github.com/influxdata/chronograf/pull/2502): Fix cursor flashing between default and pointer
1.  [#2598](https://github.com/influxdata/chronograf/pull/2598): Allow appendage of a suffix to single stat visualizations
1.  [#2598](https://github.com/influxdata/chronograf/pull/2598): Allow optional colorization of text instead of background on single stat visualizations

### Bug Fixes

1.  [#2528](https://github.com/influxdata/chronograf/pull/2528): Fix template rendering to ignore template if not in query
1.  [#2563](https://github.com/influxdata/chronograf/pull/2563): Fix graph inversion if user input y-axis min greater than max

## v1.4.0.0-beta1 [2017-12-07]

### Features

1.  [#2506](https://github.com/influxdata/chronograf/pull/2506): Add support for multiple organizations, multiple users with role-based access control, and private instances
1.  [#2188](https://github.com/influxdata/chronograf/pull/2188): Add Kapacitor logs to the TICKscript editor
1.  [#2385](https://github.com/influxdata/chronograf/pull/2385): Add time shift feature to DataExplorer and Dashboards
1.  [#2426](https://github.com/influxdata/chronograf/pull/2426): Add auto group by time to Data Explorer
1.  [#2479](https://github.com/influxdata/chronograf/pull/2479): Support authentication for Enterprise Meta Nodes
1.  [#2456](https://github.com/influxdata/chronograf/pull/2456): Add boolean thresholds for kapacitor threshold alerts
1.  [#2460](https://github.com/influxdata/chronograf/pull/2460): Update kapacitor alerts to cast to float before sending to influx
1.  [#2400](https://github.com/influxdata/chronograf/pull/2400): Allow override of generic oauth2 keys for email

### UI Improvements

1.  [#2410](https://github.com/influxdata/chronograf/pull/2410): Introduce customizable Gauge visualization type for dashboard cells
1.  [#2427](https://github.com/influxdata/chronograf/pull/2427): Improve performance of Hosts, Alert History, and TICKscript logging pages when there are many items to display
1.  [#2384](https://github.com/influxdata/chronograf/pull/2384): Add filtering by name to Dashboard index page
1.  [#2477](https://github.com/influxdata/chronograf/pull/2477): Improve performance of hoverline rendering

### Bug Fixes

1.  [#2449](https://github.com/influxdata/chronograf/pull/2449): Fix .jsdep step fails when LDFLAGS is exported
1.  [#2157](https://github.com/influxdata/chronograf/pull/2157): Fix logscale producing console errors when only one point in graph
1.  [#2158](https://github.com/influxdata/chronograf/pull/2158): Fix 'Cannot connect to source' false error flag on Dashboard page
1.  [#2167](https://github.com/influxdata/chronograf/pull/2167): Add fractions of seconds to time field in csv export
1.  [#2087](https://github.com/influxdata/chronograf/pull/2087): Fix Chronograf requiring Telegraf's CPU and system plugins to ensure that all Apps appear on the HOST LIST page.
1.  [#2222](https://github.com/influxdata/chronograf/pull/2222): Fix template variables in dashboard query building.
1.  [#2291](https://github.com/influxdata/chronograf/pull/2291): Fix several kapacitor alert creation panics.
1.  [#2303](https://github.com/influxdata/chronograf/pull/2303): Add shadow-utils to RPM release packages
1.  [#2292](https://github.com/influxdata/chronograf/pull/2292): Source extra command line options from defaults file
1.  [#2327](https://github.com/influxdata/chronograf/pull/2327): After CREATE/DELETE queries, refresh list of databases in Data Explorer
1.  [#2327](https://github.com/influxdata/chronograf/pull/2327): Visualize CREATE/DELETE queries with Table view in Data Explorer
1.  [#2329](https://github.com/influxdata/chronograf/pull/2329): Include tag values alongside measurement name in Data Explorer result tabs
1.  [#2410](https://github.com/influxdata/chronograf/pull/2410): Redesign cell display options panel
1.  [#2386](https://github.com/influxdata/chronograf/pull/2386): Fix queries that include regex, numbers and wildcard
1.  [#2398](https://github.com/influxdata/chronograf/pull/2398): Fix apps on hosts page from parsing tags with null values
1.  [#2408](https://github.com/influxdata/chronograf/pull/2408): Fix updated Dashboard names not updating dashboard list
1.  [#2444](https://github.com/influxdata/chronograf/pull/2444): Fix create dashboard button
1.  [#2416](https://github.com/influxdata/chronograf/pull/2416): Fix default y-axis labels not displaying properly
1.  [#2423](https://github.com/influxdata/chronograf/pull/2423): Gracefully scale Template Variables Manager overlay on smaller displays
1.  [#2426](https://github.com/influxdata/chronograf/pull/2426): Fix Influx Enterprise users from deletion in race condition
1.  [#2467](https://github.com/influxdata/chronograf/pull/2467): Fix oauth2 logout link not having basepath
1.  [#2466](https://github.com/influxdata/chronograf/pull/2466): Fix supplying a role link to sources that do not have a metaURL
1.  [#2477](https://github.com/influxdata/chronograf/pull/2477): Fix hoverline intermittently not rendering
1.  [#2483](https://github.com/influxdata/chronograf/pull/2483): Update MySQL pre-canned dashboard to have query derivative correctly

### Features

1.  [#2188](https://github.com/influxdata/chronograf/pull/2188): Add Kapacitor logs to the TICKscript editor
1.  [#2384](https://github.com/influxdata/chronograf/pull/2384): Add filtering by name to Dashboard index page
1.  [#2385](https://github.com/influxdata/chronograf/pull/2385): Add time shift feature to DataExplorer and Dashboards
1.  [#2400](https://github.com/influxdata/chronograf/pull/2400): Allow override of generic oauth2 keys for email
1.  [#2426](https://github.com/influxdata/chronograf/pull/2426): Add auto group by time to Data Explorer
1.  [#2456](https://github.com/influxdata/chronograf/pull/2456): Add boolean thresholds for kapacitor threshold alerts
1.  [#2460](https://github.com/influxdata/chronograf/pull/2460): Update kapacitor alerts to cast to float before sending to influx
1.  [#2479](https://github.com/influxdata/chronograf/pull/2479): Support authentication for Enterprise Meta Nodes
1.  [#2477](https://github.com/influxdata/chronograf/pull/2477): Improve performance of hoverline rendering

## v1.3.10.0 [2017-10-24]

### Bug Fixes

1.  [#2095](https://github.com/influxdata/chronograf/pull/2095): Improve the copy in the retention policy edit page
1.  [#2122](https://github.com/influxdata/chronograf/pull/2122): Fix 'Could not connect to source' bug on source creation with unsafe-ssl
1.  [#2093](https://github.com/influxdata/chronograf/pull/2093): Fix when exporting `SHOW DATABASES` CSV has bad data
1.  [#2098](https://github.com/influxdata/chronograf/pull/2098): Fix not-equal-to highlighting in Kapacitor Rule Builder
1.  [#2130](https://github.com/influxdata/chronograf/pull/2130): Fix undescriptive error messages for database and retention policy creation
1.  [#2135](https://github.com/influxdata/chronograf/pull/2135): Fix drag and drop cancel button when writing data in the data explorer
1.  [#2128](https://github.com/influxdata/chronograf/pull/2128): Fix persistence of "SELECT AS" statements in queries

### Features

1.  [#2083](https://github.com/influxdata/chronograf/pull/2083): Every dashboard can now have its own time range
1.  [#2045](https://github.com/influxdata/chronograf/pull/2045): Add CSV download option in dashboard cells
1.  [#2133](https://github.com/influxdata/chronograf/pull/2133): Implicitly prepend source urls with http://
1.  [#2127](https://github.com/influxdata/chronograf/pull/2127): Add support for graph zooming and point display on the millisecond-level
1.  [#2103](https://github.com/influxdata/chronograf/pull/2103): Add manual refresh button for Dashboard, Data Explorer, and Host Pages

### UI Improvements

1.  [#2111](https://github.com/influxdata/chronograf/pull/2111): Increase size of Cell Editor query tabs to reveal more of their query strings
1.  [#2120](https://github.com/influxdata/chronograf/pull/2120): Improve appearance of Admin Page tabs on smaller screens
1.  [#2119](https://github.com/influxdata/chronograf/pull/2119): Add cancel button to TICKscript editor
1.  [#2104](https://github.com/influxdata/chronograf/pull/2104): Redesign dashboard naming & renaming interaction
1.  [#2104](https://github.com/influxdata/chronograf/pull/2104): Redesign dashboard switching dropdown

## v1.3.9.0 [2017-10-06]

### Bug Fixes

1.  [#2004](https://github.com/influxdata/chronograf/pull/2004): Fix Data Explorer disappearing query templates in dropdown
1.  [#2006](https://github.com/influxdata/chronograf/pull/2006): Fix missing alert for duplicate db name
1.  [#2015](https://github.com/influxdata/chronograf/pull/2015): Chronograf shows real status for windows hosts when metrics are saved in non-default db - thank you, @ar7z1!
1.  [#2019](https://github.com/influxdata/chronograf/pull/2006): Fix false error warning for duplicate kapacitor name
1.  [#2018](https://github.com/influxdata/chronograf/pull/2018): Fix unresponsive display options and query builder in dashboards
1.  [#2004](https://github.com/influxdata/chronograf/pull/2004): Fix DE query templates dropdown disappearance
1.  [#2006](https://github.com/influxdata/chronograf/pull/2006): Fix no alert for duplicate db name
1.  [#2015](https://github.com/influxdata/chronograf/pull/2015): Chronograf shows real status for windows hosts when metrics are saved in non-default db - thank you, @ar7z1!
1.  [#2019](https://github.com/influxdata/chronograf/pull/2006): Fix false error warning for duplicate kapacitor name
1.  [#2018](https://github.com/influxdata/chronograf/pull/2018): Fix unresponsive display options and query builder in dashboards
1.  [#1996](https://github.com/influxdata/chronograf/pull/1996): Able to switch InfluxDB sources on a per graph basis

### Features

1.  [#1885](https://github.com/influxdata/chronograf/pull/1885): Add `fill` options to data explorer and dashboard queries
1.  [#1978](https://github.com/influxdata/chronograf/pull/1978): Support editing kapacitor TICKscript
1.  [#1721](https://github.com/influxdata/chronograf/pull/1721): Introduce the TICKscript editor UI
1.  [#1992](https://github.com/influxdata/chronograf/pull/1992): Add .csv download button to data explorer
1.  [#2082](https://github.com/influxdata/chronograf/pull/2082): Add Data Explorer InfluxQL query and location query synchronization, so queries can be shared via a a URL
1.  [#1996](https://github.com/influxdata/chronograf/pull/1996): Able to switch InfluxDB sources on a per graph basis
1.  [#2041](https://github.com/influxdata/chronograf/pull/2041): Add now() as an option in the Dashboard date picker

### UI Improvements

1.  [#2002](https://github.com/influxdata/chronograf/pull/2002): Require a second click when deleting a dashboard cell
1.  [#2002](https://github.com/influxdata/chronograf/pull/2002): Sort database list in Schema Explorer alphabetically
1.  [#2002](https://github.com/influxdata/chronograf/pull/2002): Improve usability of dashboard cell context menus
1.  [#2002](https://github.com/influxdata/chronograf/pull/2002): Move dashboard cell renaming UI into Cell Editor Overlay
1.  [#2040](https://github.com/influxdata/chronograf/pull/2040): Prevent the legend from overlapping graphs at the bottom of the screen
1.  [#2054](https://github.com/influxdata/chronograf/pull/2054): Add a "Plus" icon to every button with an Add or Create action for clarity and consistency
1.  [#2052](https://github.com/influxdata/chronograf/pull/2052): Make hovering over series smoother
1.  [#2071](https://github.com/influxdata/chronograf/pull/2071): Reduce the number of pixels per cell to one point per 3 pixels
1.  [#2072](https://github.com/influxdata/chronograf/pull/2072): Remove tabs from Data Explorer
1.  [#2057](https://github.com/influxdata/chronograf/pull/2057): Improve appearance of placeholder text in inputs
1.  [#2057](https://github.com/influxdata/chronograf/pull/2057): Add ability to use "Default" values in Source Connection form
1.  [#2069](https://github.com/influxdata/chronograf/pull/2069): Display name & port in SourceIndicator tooltip
1.  [#2078](https://github.com/influxdata/chronograf/pull/2078): Improve UX/UI of Kapacitor Rule Builder to be more intuitive
1.  [#2078](https://github.com/influxdata/chronograf/pull/2078): Rename "Measurements" to "Measurements & Tags" in Query Builder

## v1.3.8.0 [2017-09-07]

### Bug Fixes

1.  [#1886](https://github.com/influxdata/chronograf/pull/1886): Fix the limit of 100 alert rules on alert rules page
1.  [#1930](https://github.com/influxdata/chronograf/pull/1930): Fix graphs when y-values are constant
1.  [#1951](https://github.com/influxdata/chronograf/pull/1951): Fix crosshair not being removed when user leaves graph
1.  [#1943](https://github.com/influxdata/chronograf/pull/1943): Fix inability to add kapacitor from source page on fresh install
1.  [#1947](https://github.com/influxdata/chronograf/pull/1947): Fix DataExplorer crashing if a field property is not present in the queryConfig
1.  [#1957](https://github.com/influxdata/chronograf/pull/1957): Fix the max y value of stacked graphs preventing display of the upper bounds of the chart
1.  [#1969](https://github.com/influxdata/chronograf/pull/1969): Fix for delayed selection of template variables using URL query params
1.  [#1982](https://github.com/influxdata/chronograf/pull/1982): Fix return code on meta nodes when raft redirects to leader

### Features

1.  [#1928](https://github.com/influxdata/chronograf/pull/1928): Add prefix, suffix, scale, and other y-axis formatting for cells in dashboards
1.  [#1934](https://github.com/influxdata/chronograf/pull/1934): Update the group by time when zooming in graphs
1.  [#1945](https://github.com/influxdata/chronograf/pull/1945): Add the ability to link directly to presentation mode in dashboards with the `present` boolean query parameter in the URL
1.  [#1969](https://github.com/influxdata/chronograf/pull/1969): Add the ability to select a template variable via a URL parameter

### UI Improvements

1.  [#1933](https://github.com/influxdata/chronograf/pull/1933): Use line-stacked graph type for memory information - thank you, @Joxit!
1.  [#1940](https://github.com/influxdata/chronograf/pull/1940): Improve cell sizes in Admin Database tables
1.  [#1942](https://github.com/influxdata/chronograf/pull/1942): Polish appearance of optional alert parameters in Kapacitor rule builder
1.  [#1944](https://github.com/influxdata/chronograf/pull/1944): Add active state for Status page navbar icon
1.  [#1944](https://github.com/influxdata/chronograf/pull/1944): Improve UX of navigation to a sub-nav item in the navbar
1.  [#1971](https://github.com/influxdata/chronograf/pull/1971): Resolve confusing deadman trigger alert rule UI

## v1.3.7.0 [2017-08-23]

### Features

1.  [#1928](https://github.com/influxdata/chronograf/pull/1928): Add prefix, suffix, scale, and other y-axis formatting

## v1.3.7.0

### Bug Fixes

1.  [#1795](https://github.com/influxdata/chronograf/pull/1795): Fix uptime status on Windows hosts running Telegraf
1.  [#1715](https://github.com/influxdata/chronograf/pull/1715): Chronograf now renders on IE11.
1.  [#1870](https://github.com/influxdata/chronograf/pull/1870): Fix console error for placing prop on div
1.  [#1864](https://github.com/influxdata/chronograf/pull/1864): Fix Write Data form upload button and add `onDragExit` handler
1.  [#1891](https://github.com/influxdata/chronograf/pull/1891): Fix Kapacitor config for PagerDuty via the UI
1.  [#1872](https://github.com/influxdata/chronograf/pull/1872): Prevent stats in the legend from wrapping line

### Features

1.  [#1863](https://github.com/influxdata/chronograf/pull/1863): Improve 'new-sources' server flag example by adding 'type' key

### UI Improvements

1.  [#1862](https://github.com/influxdata/chronograf/pull/1862): Show "Add Graph" button on cells with no queries

## v1.3.6.1 [2017-08-14]

**Upgrade Note** This release (1.3.6.1) fixes a possibly data corruption issue with dashboard cells' graph types. If you upgraded to 1.3.6.0 and visited any dashboard, once you have then upgraded to this release (1.3.6.1) you will need to manually reset the graph type for every cell via the cell's caret --> Edit --> Display Options. If you upgraded directly to 1.3.6.1, you should not experience this issue.

## Bug Fixes

1.  [#1795](https://github.com/influxdata/chronograf/pull/1795): Fix uptime status on Windows hosts running Telegraf
1.  [#1715](https://github.com/influxdata/chronograf/pull/1715): Chronograf now renders on IE11.
1.  [#1870](https://github.com/influxdata/chronograf/pull/1870): Fix console error for placing prop on div
1.  [#1864](https://github.com/influxdata/chronograf/pull/1864): Fix Write Data form upload button and add `onDragExit` handler
1.  [#1866](https://github.com/influxdata/chronograf/pull/1866): Fix missing cell type (and consequently single-stat)
1.  [#1891](https://github.com/influxdata/chronograf/pull/1891): Fix Kapacitor config for PagerDuty via the UI
1.  [#1897](https://github.com/influxdata/chronograf/pull/1897): Fix regression from [#1864](https://github.com/influxdata/chronograf/pull/1864) and redesign drag & drop interaction
1.  [#1872](https://github.com/influxdata/chronograf/pull/1872): Prevent stats in the legend from wrapping line
1.  [#1899](https://github.com/influxdata/chronograf/pull/1899): Fix raw query editor in Data Explorer not using selected time
1.  [#1922](https://github.com/influxdata/chronograf/pull/1922): Fix Safari display issues in the Cell Editor display options
1.  [#1715](https://github.com/influxdata/chronograf/pull/1715): Chronograf now renders on IE11.
1.  [#1866](https://github.com/influxdata/chronograf/pull/1866): Fix missing cell type (and consequently single-stat)
1.  [#1866](https://github.com/influxdata/chronograf/pull/1866): Fix data corruption issue with dashboard graph types
    **Note**: If you upgraded to 1.3.6.0 and visited any dashboard, you will need to manually reset the graph type for every cell via the cell's caret -> Edit -> Display Options.
1.  [#1870](https://github.com/influxdata/chronograf/pull/1870): Fix console error for placing prop on div
1.  [#1845](https://github.com/influxdata/chronograf/pull/1845): Fix inaccessible scroll bar in Data Explorer table
1.  [#1866](https://github.com/influxdata/chronograf/pull/1866): Fix non-persistence of dashboard graph types
1.  [#1872](https://github.com/influxdata/chronograf/pull/1872): Prevent stats in the legend from wrapping line

### Features

1.  [#1863](https://github.com/influxdata/chronograf/pull/1863): Improve 'new-sources' server flag example by adding 'type' key
1.  [#1898](https://github.com/influxdata/chronograf/pull/1898): Add an input and validation to custom time range calendar dropdowns
1.  [#1904](https://github.com/influxdata/chronograf/pull/1904): Add support for selecting template variables with URL params
1.  [#1859](https://github.com/influxdata/chronograf/pull/1859): Add y-axis controls to the API for layouts

### UI Improvements

1.  [#1862](https://github.com/influxdata/chronograf/pull/1862): Show "Add Graph" button on cells with no queries

## v1.3.6.1 [2017-08-14]

**Upgrade Note** This release (1.3.6.1) fixes a possibly data corruption issue with dashboard cells' graph types. If you upgraded to 1.3.6.0 and visited any dashboard, once you have then upgraded to this release (1.3.6.1) you will need to manually reset the graph type for every cell via the cell's caret --> Edit --> Display Options. If you upgraded directly to 1.3.6.1, you should not experience this issue.

### Bug Fixes

1.  [#1845](https://github.com/influxdata/chronograf/pull/1845): Fix inaccessible scroll bar in Data Explorer table
1.  [#1866](https://github.com/influxdata/chronograf/pull/1866): Fix non-persistence of dashboard graph types

### Features

1.  [#1859](https://github.com/influxdata/chronograf/pull/1859): Add y-axis controls to the API for layouts

### UI Improvements

1.  [#1846](https://github.com/influxdata/chronograf/pull/1846): Increase screen real estate of Query Maker in the Cell Editor Overlay

## v1.3.6.0 [2017-08-08]

### Bug Fixes

1.  [#1798](https://github.com/influxdata/chronograf/pull/1798): Fix domain not updating in visualizations when changing time range manually
1.  [#1799](https://github.com/influxdata/chronograf/pull/1799): Prevent console error spam from Dygraph's synchronize method when a dashboard has only one graph
1.  [#1813](https://github.com/influxdata/chronograf/pull/1813): Guarantee UUID for each Alert Table key to prevent dropping items when keys overlap
1.  [#1795](https://github.com/influxdata/chronograf/pull/1795): Fix uptime status on Windows hosts running Telegraf
1.  [#1715](https://github.com/influxdata/chronograf/pull/1715): Chronograf now renders properly on IE11.

### Features

1.  [#1744](https://github.com/influxdata/chronograf/pull/1744): Add a few time range shortcuts to the custom time range menu
1.  [#1714](https://github.com/influxdata/chronograf/pull/1714): Add ability to edit a dashboard graph's y-axis bounds
1.  [#1714](https://github.com/influxdata/chronograf/pull/1714): Add ability to edit a dashboard graph's y-axis label
1.  [#1744](https://github.com/influxdata/chronograf/pull/1744): Add a few pre-set time range selections to the custom time range menu-- be sure to add a sensible GROUP BY
1.  [#1744](https://github.com/influxdata/chronograf/pull/1744): Add a few time range shortcuts to the custom time range menu

### UI Improvements

1.  [#1796](https://github.com/influxdata/chronograf/pull/1796): Add spinner write data modal to indicate data is being written
1.  [#1805](https://github.com/influxdata/chronograf/pull/1805): Fix bar graphs overlapping
1.  [#1805](https://github.com/influxdata/chronograf/pull/1805): Assign a series consistent coloring when it appears in multiple cells
1.  [#1800](https://github.com/influxdata/chronograf/pull/1800): Increase size of line protocol manual entry in Data Explorer's Write Data overlay
1.  [#1812](https://github.com/influxdata/chronograf/pull/1812): Improve error message when request for Status Page News Feed fails
1.  [#1858](https://github.com/influxdata/chronograf/pull/1858): Provide affirmative UI choice for 'auto' in DisplayOptions with new toggle-based component

## v1.3.5.0 [2017-07-27]

### Bug Fixes

1.  [#1708](https://github.com/influxdata/chronograf/pull/1708): Fix z-index issue in dashboard cell context menu
1.  [#1752](https://github.com/influxdata/chronograf/pull/1752): Clarify BoltPath server flag help text by making example the default path
1.  [#1703](https://github.com/influxdata/chronograf/pull/1703): Fix cell name cancel not reverting to original name
1.  [#1751](https://github.com/influxdata/chronograf/pull/1751): Fix typo that may have affected PagerDuty node creation in Kapacitor
1.  [#1756](https://github.com/influxdata/chronograf/pull/1756): Prevent 'auto' GROUP BY as option in Kapacitor rule builder when applying a function to a field
1.  [#1773](https://github.com/influxdata/chronograf/pull/1773): Prevent clipped buttons in Rule Builder, Data Explorer, and Configuration pages
1.  [#1776](https://github.com/influxdata/chronograf/pull/1776): Fix JWT for the write path
1.  [#1777](https://github.com/influxdata/chronograf/pull/1777): Disentangle client Kapacitor rule creation from Data Explorer query creation

### Features

1.  [#1717](https://github.com/influxdata/chronograf/pull/1717): View server generated TICKscripts
1.  [#1681](https://github.com/influxdata/chronograf/pull/1681): Add the ability to select Custom Time Ranges in the Hostpages, Data Explorer, and Dashboards
1.  [#1752](https://github.com/influxdata/chronograf/pull/1752): Clarify BoltPath server flag help text by making example the default path
1.  [#1738](https://github.com/influxdata/chronograf/pull/1738): Add shared secret JWT authorization to InfluxDB
1.  [#1724](https://github.com/influxdata/chronograf/pull/1724): Add Pushover alert support
1.  [#1762](https://github.com/influxdata/chronograf/pull/1762): Restore all supported Kapacitor services when creating rules, and add most optional message parameters
1.  [#1681](https://github.com/influxdata/chronograf/pull/1681): Add the ability to select Custom Time Ranges in the Hostpages, Data Explorer, and Dashboards.
1.  [#1717](https://github.com/influxdata/chronograf/pull/1717): View server generated TICKscripts

### UI Improvements

1.  [#1707](https://github.com/influxdata/chronograf/pull/1707): Polish alerts table in status page to wrap text less
1.  [#1770](https://github.com/influxdata/chronograf/pull/1770): Specify that version is for Chronograf on Configuration page
1.  [#1779](https://github.com/influxdata/chronograf/pull/1779): Move custom time range indicator on cells into corner when in presentation mode
1.  [#1779](https://github.com/influxdata/chronograf/pull/1779): Highlight legend "Snip" toggle when active

## v1.3.4.0 [2017-07-10]

### Bug Fixes

1.  [#1612](https://github.com/influxdata/chronograf/pull/1612): Disallow writing to \_internal in the Data Explorer
1.  [#1655](https://github.com/influxdata/chronograf/pull/1655): Add more than one color to Line+Stat graphs
1.  [#1688](https://github.com/influxdata/chronograf/pull/1688): Fix updating Retention Policies in single-node InfluxDB instances
1.  [#1689](https://github.com/influxdata/chronograf/pull/1689): Lock the width of Template Variable dropdown menus to the size of their longest option

### Features

1.  [#1645](https://github.com/influxdata/chronograf/pull/1645): Add Auth0 as a supported OAuth2 provider
1.  [#1660](https://github.com/influxdata/chronograf/pull/1660): Add ability to add custom links to User menu via server CLI or ENV vars
1.  [#1660](https://github.com/influxdata/chronograf/pull/1660): Allow users to configure custom links on startup that will appear under the User menu in the sidebar
1.  [#1674](https://github.com/influxdata/chronograf/pull/1674): Add support for Auth0 organizations
1.  [#1695](https://github.com/influxdata/chronograf/pull/1695): Allow users to configure InfluxDB and Kapacitor sources on startup

### UI Improvements

1.  [#1644](https://github.com/influxdata/chronograf/pull/1644): Redesign Alerts History table on Status Page to have sticky headers
1.  [#1581](https://github.com/influxdata/chronograf/pull/1581): Refresh Template Variable values on Dashboard page load
1.  [#1655](https://github.com/influxdata/chronograf/pull/1655): Display current version of Chronograf at the bottom of Configuration page
1.  [#1655](https://github.com/influxdata/chronograf/pull/1655): Redesign Dashboards table and sort them alphabetically
1.  [#1655](https://github.com/influxdata/chronograf/pull/1655): Bring design of navigation sidebar in line with Branding Documentation

## v1.3.3.3 [2017-06-21]

### Bug Fixes

1.  [1651](https://github.com/influxdata/chronograf/pull/1651): Add back in x and y axes and revert some style changes on Line + Single Stat graphs

## v1.3.3.2 [2017-06-21]

## v1.3.3.3 [2017-06-21]

### Bug Fixes

1.  [1651](https://github.com/influxdata/chronograf/pull/1651): Add back in x and y axes and revert some style changes on Line + Single Stat graphs

## v1.3.3.2 [2017-06-21]

### Bug Fixes

1.  [1650](https://github.com/influxdata/chronograf/pull/1650): Fix broken cpu reporting on hosts page and normalize InfluxQL

## v1.3.3.1 [2017-06-21]

### Bug Fixes

1.  [#1641](https://github.com/influxdata/chronograf/pull/1641): Fix enable / disable being out of sync on Kapacitor Rules Page

### Features

1.  [#1647](https://github.com/influxdata/chronograf/pull/1647): Add file uploader to Data Explorer for write protocol

### UI Improvements

1.  [#1642](https://github.com/influxdata/chronograf/pull/1642): Do not prefix basepath to external link for news feed

## v1.3.3.0 [2017-06-19]

### Bug Fixes

1.  [#1512](https://github.com/influxdata/chronograf/pull/1512): Prevent legend from flowing over window bottom bound
1.  [#1600](https://github.com/influxdata/chronograf/pull/1600): Prevent Kapacitor configurations from having the same name
1.  [#1600](https://github.com/influxdata/chronograf/pull/1600): Limit Kapacitor configuration names to 33 characters to fix display bug
1.  [#1622](https://github.com/influxdata/chronograf/pull/1622): Use function selector grid in Kapacitor rule builder query maker instead of dropdown

### Features

1.  [#1512](https://github.com/influxdata/chronograf/pull/1512): Synchronize vertical crosshair at same time across all graphs in a dashboard
1.  [#1609](https://github.com/influxdata/chronograf/pull/1609): Add automatic GROUP BY (time) functionality to dashboards
1.  [#1608](https://github.com/influxdata/chronograf/pull/1608): Add a Status Page with Recent Alerts bar graph, Recent Alerts table, News Feed, and Getting Started widgets

### UI Improvements

1.  [#1512](https://github.com/influxdata/chronograf/pull/1512): When dashboard time range is changed, reset graphs that are zoomed in
1.  [#1599](https://github.com/influxdata/chronograf/pull/1599): Bar graph option added to dashboard
1.  [#1600](https://github.com/influxdata/chronograf/pull/1600): Redesign source management table to be more intuitive
1.  [#1600](https://github.com/influxdata/chronograf/pull/1600): Redesign Line + Single Stat cells to appear more like a sparkline, and improve legibility
1.  [#1639](https://github.com/influxdata/chronograf/pull/1639): Improve graph synchronization performance

## v1.3.2.1 [2017-06-06]

### Bug Fixes

1.  [#1594](https://github.com/influxdata/chronograf/pull/1594): Restore Line + Single Stat styles

## v1.3.2.0 [2017-06-05]

### Bug Fixes

1.  [#1530](https://github.com/influxdata/chronograf/pull/1530): Update the query config's field ordering to always match the input query
1.  [#1535](https://github.com/influxdata/chronograf/pull/1535): Allow users to add functions to existing Kapacitor rules
1.  [#1564](https://github.com/influxdata/chronograf/pull/1564): Fix logout menu item regression
1.  [#1562](https://github.com/influxdata/chronograf/pull/1562): Fix InfluxQL parsing with multiple tag values for a tag key
1.  [#1582](https://github.com/influxdata/chronograf/pull/1582): Fix load localStorage and warning UX on fresh Chronograf install
1.  [#1584](https://github.com/influxdata/chronograf/pull/1584): Show submenus when the alert notification is present

### Features

1.  [#1537](https://github.com/influxdata/chronograf/pull/1537): Add UI to the Data Explorer for [writing data to InfluxDB](https://docs.influxdata.com/chronograf/latest/guides/transition-web-admin-interface/#writing-data)

### UI Improvements

1.  [#1508](https://github.com/influxdata/chronograf/pull/1508): Make the enter and escape keys perform as expected when renaming dashboards
1.  [#1524](https://github.com/influxdata/chronograf/pull/1524): Improve copy on the Kapacitor configuration page
1.  [#1549](https://github.com/influxdata/chronograf/pull/1549): Reset graph zoom when the user selects a new time range
1.  [#1544](https://github.com/influxdata/chronograf/pull/1544): Upgrade to new version of Influx Theme, and remove excess stylesheets
1.  [#1567](https://github.com/influxdata/chronograf/pull/1567): Replace the user icon with a solid style
1.  [#1561](https://github.com/influxdata/chronograf/pull/1561): Disable query save in cell editor mode if the query does not have a database, measurement, and field
1.  [#1575](https://github.com/influxdata/chronograf/pull/1575): Improve UX of applying functions to fields in the query builder
1.  [#1560](https://github.com/influxdata/chronograf/pull/1560): Apply mean to fields by default

## v1.3.1.0 [2017-05-22]

### Release notes

In versions 1.3.1+, installing a new version of Chronograf automatically clears the localStorage settings.

### Bug Fixes

1.  [#1450](https://github.com/influxdata/chronograf/pull/1450): Fix infinite spinner when `/chronograf` is a [basepath](https://docs.influxdata.com/chronograf/v1.3/administration/configuration/#p-basepath)
1.  [#1472](https://github.com/influxdata/chronograf/pull/1472): Remove the query templates dropdown from dashboard cell editor mode
1.  [#1458](https://github.com/influxdata/chronograf/pull/1458): New versions of Chronograf automatically clear localStorage settings
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Fix the backwards sort arrows in table column headers
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Fix the loading spinner on graphs
1.  [#1485](https://github.com/influxdata/chronograf/pull/1485): Filter out any template variable values that are empty, whitespace, or duplicates
1.  [#1484](https://github.com/influxdata/chronograf/pull/1484): Allow user to select SingleStat as Visualization Type before adding any queries and continue to be able to click Add Query
1.  [#1349](https://github.com/influxdata/chronograf/pull/1349): Add query for windows uptime
1.  [#1484](https://github.com/influxdata/chronograf/pull/1484): Allow users to click the add query button after selecting singleStat as the [visualization type](https://docs.influxdata.com/chronograf/v1.3/troubleshooting/frequently-asked-questions/#what-visualization-types-does-chronograf-support)
1.  [#1349](https://github.com/influxdata/chronograf/pull/1349): Add a query for windows uptime - thank you, @brianbaker!

### Features

1.  [#1477](https://github.com/influxdata/chronograf/pull/1477): Add log [event handler](https://docs.influxdata.com/chronograf/v1.3/troubleshooting/frequently-asked-questions/#what-kapacitor-event-handlers-are-supported-in-chronograf) - thank you, @mpchadwick!
1.  [#1491](https://github.com/influxdata/chronograf/pull/1491): Update Go (golang) vendoring to dep and committed vendor directory
1.  [#1500](https://github.com/influxdata/chronograf/pull/1500): Add autocomplete functionality to [template variable](https://docs.influxdata.com/chronograf/v1.3/guides/dashboard-template-variables/) dropdowns

### UI Improvements

1.  [#1451](https://github.com/influxdata/chronograf/pull/1451): Refactor scrollbars to support non-webkit browsers
1.  [#1453](https://github.com/influxdata/chronograf/pull/1453): Increase the query builder's default height in cell editor mode and in the data explorer
1.  [#1453](https://github.com/influxdata/chronograf/pull/1453): Give QueryMaker a greater initial height than Visualization
1.  [#1475](https://github.com/influxdata/chronograf/pull/1475): Add ability to toggle visibility of the Template Control Bar
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Make the [template variables](https://docs.influxdata.com/chronograf/v1.3/guides/dashboard-template-variables/) manager more space efficient
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Add page spinners to pages that did not have them
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Denote which source is connected in the sources table
1.  [#1464](https://github.com/influxdata/chronograf/pull/1464): Make the logout button consistent with design
1.  [#1478](https://github.com/influxdata/chronograf/pull/1478): Use milliseconds in the InfluxDB dashboard instead of nanoseconds
1.  [#1498](https://github.com/influxdata/chronograf/pull/1498): Notify users when local settings are cleared

## v1.3.0 [2017-05-09]

### Bug Fixes

1.  [#1364](https://github.com/influxdata/chronograf/pull/1364): Fix the link to home when using the `--basepath` option
1.  [#1370](https://github.com/influxdata/chronograf/pull/1370): Remove the notification to login on the login page
1.  [#1376](https://github.com/influxdata/chronograf/pull/1376): Support queries that perform math on functions
1.  [#1399](https://github.com/influxdata/chronograf/pull/1399): Prevent the creation of blank template variables
1.  [#1406](https://github.com/influxdata/chronograf/pull/1406): Ensure thresholds for Kapacitor Rule Alerts appear on page load
1.  [#1412](https://github.com/influxdata/chronograf/pull/1412): Update the Kapacitor configuration page when the configuration changes
1.  [#1407](https://github.com/influxdata/chronograf/pull/1407): Fix Authentication when using Chronograf with a set `basepath`
1.  [#1417](https://github.com/influxdata/chronograf/pull/1417): Support escaping from presentation mode in Safari
1.  [#1365](https://github.com/influxdata/chronograf/pull/1365): Show red indicator on Hosts Page for an offline host
1.  [#1379](https://github.com/influxdata/chronograf/pull/1379): Re-implement level colors on the alerts page
1.  [#1433](https://github.com/influxdata/chronograf/pull/1433): Fix router bug introduced by upgrading to react-router v3.0
1.  [#1435](https://github.com/influxdata/chronograf/pull/1435): Show legend on Line+Stat visualization type
1.  [#1436](https://github.com/influxdata/chronograf/pull/1436): Prevent queries with `:dashboardTime:` from breaking the query builder

### Features

1.  [#1382](https://github.com/influxdata/chronograf/pull/1382): Add line-protocol proxy for InfluxDB/InfluxEnterprise Cluster data sources
1.  [#1391](https://github.com/influxdata/chronograf/pull/1391): Add `:dashboardTime:` to support cell-specific time ranges on dashboards
1.  [#1201](https://github.com/influxdata/chronograf/pull/1201): Add support for enabling and disabling TICKscripts that were created outside Chronograf
1.  [#1401](https://github.com/influxdata/chronograf/pull/1401): Allow users to delete Kapacitor configurations

### UI Improvements

1.  [#1378](https://github.com/influxdata/chronograf/pull/1378): Save user-provided relative time ranges in cells
1.  [#1373](https://github.com/influxdata/chronograf/pull/1373): Improve how cell legends and options appear on dashboards
1.  [#1385](https://github.com/influxdata/chronograf/pull/1385): Combine the measurements and tags columns in the Data Explorer and implement a new design for applying functions to fields
1.  [#602](https://github.com/influxdata/chronograf/pull/602): Normalize the terminology in Chronograf
1.  [#1392](https://github.com/influxdata/chronograf/pull/1392): Make overlays full-screen
1.  [#1395](https://github.com/influxdata/chronograf/pull/1395):Change the default global time range to past 1 hour
1.  [#1439](https://github.com/influxdata/chronograf/pull/1439): Add Source Indicator icon to the Configuration and Admin pages

## v1.2.0-beta10 [2017-04-28]

### Bug Fixes

1.  [#1337](https://github.com/influxdata/chronograf/pull/1337): Add support for blank hostnames on the Host List page
1.  [#1340](https://github.com/influxdata/chronograf/pull/1340): Fix case where the Explorer and cell editor falsely assumed there was no active query
1.  [#1338](https://github.com/influxdata/chronograf/pull/1338): Require url and name when adding a new source
1.  [#1348](https://github.com/influxdata/chronograf/pull/1348): Fix broken `Add Kapacitor` link on the Alerts page - thank you, @nickysemenza

### Features

1.  [#1154](https://github.com/influxdata/chronograf/issues/1154): Add template variables to Chronograf's customized dashboards
1.  [#1351](https://github.com/influxdata/chronograf/pull/1351): Add a canned dashboard for [phpfpm](https://github.com/influxdata/telegraf/tree/master/plugins/inputs/phpfpm) - thank you, @nickysemenza

### UI Improvements

1.  [#1335](https://github.com/influxdata/chronograf/pull/1335): Improve UX for sanitized Kapacitor event handler settings
1.  [#1342](https://github.com/influxdata/chronograf/pull/1342): Fix DB Management's abrupt database sort; only sort databases after refresh/returning to page
1.  [#1344](https://github.com/influxdata/chronograf/pull/1344): Remove the empty, default Kubernetes dashboard
1.  [#1340](https://github.com/influxdata/chronograf/pull/1340): Automatically switch to table view the query is a meta query

## v1.2.0-beta9 [2017-04-21]

### Bug Fixes

1.  [#1257](https://github.com/influxdata/chronograf/issues/1257): Fix function selection in the query builder
1.  [#1244](https://github.com/influxdata/chronograf/pull/1244): Fix the environment variable name for Google client secret
1.  [#1269](https://github.com/influxdata/chronograf/issues/1269): Add more functionality to the explorer's query generation process
1.  [#1318](https://github.com/influxdata/chronograf/issues/1318): Fix JWT refresh for auth-durations of zero and less than five minutes
1.  [#1332](https://github.com/influxdata/chronograf/pull/1332): Remove table toggle from dashboard visualization
1.  [#1335](https://github.com/influxdata/chronograf/pull/1335): Improve UX for sanitized kapacitor settings

### Features

1.  [#1292](https://github.com/influxdata/chronograf/pull/1292): Introduce Template Variable Manager
1.  [#1232](https://github.com/influxdata/chronograf/pull/1232): Fuse the query builder and raw query editor
1.  [#1265](https://github.com/influxdata/chronograf/pull/1265): Refactor the router to use auth and force /login route when auth expires
1.  [#1286](https://github.com/influxdata/chronograf/pull/1286): Add refreshing JWTs for authentication
1.  [#1316](https://github.com/influxdata/chronograf/pull/1316): Add templates API scoped within a dashboard
1.  [#1311](https://github.com/influxdata/chronograf/pull/1311): Display currently selected values in TVControlBar
1.  [#1315](https://github.com/influxdata/chronograf/pull/1315): Send selected TV values to proxy
1.  [#1302](https://github.com/influxdata/chronograf/pull/1302): Add support for multiple Kapacitors per InfluxDB source

### UI Improvements

1.  [#1259](https://github.com/influxdata/chronograf/pull/1259): Add a default display for empty dashboard
1.  [#1258](https://github.com/influxdata/chronograf/pull/1258): Display Kapacitor alert endpoint options as radio button group
1.  [#1321](https://github.com/influxdata/chronograf/pull/1321): Add yellow color to UI, Query Editor warnings are now appropriately colored

## v1.2.0-beta8 [2017-04-07]

### Bug Fixes

1.  [#1104](https://github.com/influxdata/chronograf/pull/1104): Fix Windows hosts on the host list page
1.  [#1125](https://github.com/influxdata/chronograf/pull/1125): Show cell name when editing dashboard cells
1.  [#1134](https://github.com/influxdata/chronograf/pull/1134): Fix Enterprise Kapacitor authentication
1.  [#1142](https://github.com/influxdata/chronograf/pull/1142): Fix Telegram Kapacitor configuration to display the correct disableNotification setting
1.  [#1124](https://github.com/influxdata/chronograf/pull/1124): Fix broken graph spinner in the explorer and when editing dashboard cells
1.  [#1124](https://github.com/influxdata/chronograf/pull/1124): Fix obscured legends in dashboards
1.  [#1149](https://github.com/influxdata/chronograf/pull/1149): Exit presentation mode on dashboards when using the browser back button
1.  [#1152](https://github.com/influxdata/chronograf/pull/1152): Widen single column results in the explorer
1.  [#1164](https://github.com/influxdata/chronograf/pull/1164): Restore ability to save raw queries to a dashboard cell
1.  [#1115](https://github.com/influxdata/chronograf/pull/1115): Fix `--basepath` issue where content would fail to render under certain circumstances
1.  [#1173](https://github.com/influxdata/chronograf/pull/1173): Actually save emails in Kapacitor alerts
1.  [#1178](https://github.com/influxdata/chronograf/pull/1178): Ensure Safari renders the explorer and CellEditorOverlay correctly
1.  [#1182](https://github.com/influxdata/chronograf/pull/1182): Fix empty tags for non-default retention policies
1.  [#1179](https://github.com/influxdata/chronograf/pull/1179): Render databases without retention policies on the admin page
1.  [#1128](https://github.com/influxdata/chronograf/pull/1128): Fix dashboard cell repositioning 👻
1.  [#1189](https://github.com/influxdata/chronograf/pull/1189): Improve dashboard cell renaming UX
1.  [#1202](https://github.com/influxdata/chronograf/pull/1202): Fix server returning unquoted InfluxQL keyword identifiers (e.g. `mean(count)`)
1.  [#1203](https://github.com/influxdata/chronograf/pull/1203): Fix redirect with authentication in Chronograf for InfluxEnterprise
1.  [#1095](https://github.com/influxdata/chronograf/pull/1095): Restore the logout button
1.  [#1209](https://github.com/influxdata/chronograf/pull/1209): Ask for the HipChat subdomain instead of the entire HipChat URL in the HipChat Kapacitor configuration
1.  [#1223](https://github.com/influxdata/chronograf/pull/1223): Use vhost as Chronograf's proxy to Kapacitor
1.  [#1205](https://github.com/influxdata/chronograf/pull/1205): Allow initial source to be an InfluxEnterprise source

### Features

1.  [#1112](https://github.com/influxdata/chronograf/pull/1112): Add ability to delete a dashboard
1.  [#1120](https://github.com/influxdata/chronograf/pull/1120): Allow admins to update user passwords
1.  [#1129](https://github.com/influxdata/chronograf/pull/1129): Allow InfluxDB and Kapacitor configuration via environment vars or CLI options
1.  [#1130](https://github.com/influxdata/chronograf/pull/1130): Add loading spinner to the alert history page
1.  [#1168](https://github.com/influxdata/chronograf/pull/1168): Expand support for `--basepath` on some load balancers
1.  [#1204](https://github.com/influxdata/chronograf/pull/1204): Add Slack channel per Kapacitor alert rule configuration
1.  [#1119](https://github.com/influxdata/chronograf/pull/1119): Add new auth duration CLI option; add client heartbeat
1.  [#1207](https://github.com/influxdata/chronograf/pull/1207): Add support for custom OAuth2 providers
1.  [#1212](https://github.com/influxdata/chronograf/pull/1212): Add meta query templates and loading animation to the RawQueryEditor
1.  [#1221](https://github.com/influxdata/chronograf/pull/1221): Remove the default query from empty cells on dashboards
1.  [#1101](https://github.com/influxdata/chronograf/pull/1101): Compress InfluxQL responses with gzip

### UI Improvements

1.  [#1132](https://github.com/influxdata/chronograf/pull/1132): Show blue strip next to active tab on the sidebar
1.  [#1135](https://github.com/influxdata/chronograf/pull/1135): Clarify Kapacitor alert configuration for Telegram
1.  [#1137](https://github.com/influxdata/chronograf/pull/1137): Clarify Kapacitor alert configuration for HipChat
1.  [#1136](https://github.com/influxdata/chronograf/pull/1136): Remove series highlighting in line graphs
1.  [#1124](https://github.com/influxdata/chronograf/pull/1124): Polish UI:
    - Polish dashboard cell drag interaction
    - Use Hover-To-Reveal UI pattern in all tables
    - Clarify source Indicator & Graph Tips
    - Improve DB Management page UI
1.  [#1187](https://github.com/influxdata/chronograf/pull/1187): Replace kill query confirmation modal with confirm buttons
1.  [#1185](https://github.com/influxdata/chronograf/pull/1185): Alphabetically sort databases and retention policies on the admin page
1.  [#1199](https://github.com/influxdata/chronograf/pull/1199): Move rename cell functionality to cell dropdown menu
1.  [#1211](https://github.com/influxdata/chronograf/pull/1211): Reverse the positioning of the graph visualization and the query builder on the Data Explorer page
1.  [#1222](https://github.com/influxdata/chronograf/pull/1222): Isolate cell repositioning to just those affected by adding a new cell

## v1.2.0-beta7 [2017-03-28]

### Bug Fixes

1.  [#1008](https://github.com/influxdata/chronograf/issues/1008): Fix unexpected redirection to create sources page when deleting a source
1.  [#1067](https://github.com/influxdata/chronograf/issues/1067): Fix issue creating retention policies
1.  [#1068](https://github.com/influxdata/chronograf/issues/1068): Fix issue deleting databases
1.  [#1078](https://github.com/influxdata/chronograf/issues/1078): Fix cell resizing in dashboards
1.  [#1070](https://github.com/influxdata/chronograf/issues/1070): Save GROUP BY tag(s) clauses on dashboards
1.  [#1086](https://github.com/influxdata/chronograf/issues/1086): Fix validation for deleting databases

### Features

### UI Improvements

1.  [#1092](https://github.com/influxdata/chronograf/pull/1092): Persist and render Dashboard Cell groupby queries

## v1.2.0-beta6 [2017-03-24]

### Bug Fixes

1.  [#1065](https://github.com/influxdata/chronograf/pull/1065): Add functionality to the `save` and `cancel` buttons on editable dashboards
2.  [#1069](https://github.com/influxdata/chronograf/pull/1069): Make graphs on pre-created dashboards un-editable
3.  [#1085](https://github.com/influxdata/chronograf/pull/1085): Make graphs resizable again
4.  [#1087](https://github.com/influxdata/chronograf/pull/1087): Hosts page now displays proper loading, host count, and error messages.

### Features

1.  [#1056](https://github.com/influxdata/chronograf/pull/1056): Add ability to add a dashboard cell
2.  [#1020](https://github.com/influxdata/chronograf/pull/1020): Allow users to edit cell names on dashboards
3.  [#1015](https://github.com/influxdata/chronograf/pull/1015): Add ability to edit a dashboard cell
4.  [#832](https://github.com/influxdata/chronograf/issues/832): Add a database and retention policy management page
5.  [#1035](https://github.com/influxdata/chronograf/pull/1035): Add ability to move and edit queries between raw InfluxQL mode and Query Builder mode

### UI Improvements

## v1.2.0-beta5 [2017-03-10]

### Bug Fixes

1.  [#936](https://github.com/influxdata/chronograf/pull/936): Fix leaking sockets for InfluxQL queries
2.  [#967](https://github.com/influxdata/chronograf/pull/967): Fix flash of empty graph on auto-refresh when no results were previously returned from a query
3.  [#968](https://github.com/influxdata/chronograf/issue/968): Fix wrong database used in dashboards

### Features

1.  [#993](https://github.com/influxdata/chronograf/pull/993): Add Admin page for managing users, roles, and permissions for [OSS InfluxDB](https://github.com/influxdata/influxdb) and InfluxData's [Enterprise](https://docs.influxdata.com/enterprise/v1.2/) product
2.  [#993](https://github.com/influxdata/chronograf/pull/993): Add Query Management features including the ability to view active queries and stop queries

### UI Improvements

1.  [#989](https://github.com/influxdata/chronograf/pull/989) Add a canned dashboard for mesos
2.  [#993](https://github.com/influxdata/chronograf/pull/993): Improve the multi-select dropdown
3.  [#993](https://github.com/influxdata/chronograf/pull/993): Provide better error information to users

## v1.2.0-beta4 [2017-02-24]

### Bug Fixes

1.  [#882](https://github.com/influxdata/chronograf/pull/882): Fix y-axis graph padding
2.  [#907](https://github.com/influxdata/chronograf/pull/907): Fix react-router warning
3.  [#926](https://github.com/influxdata/chronograf/pull/926): Fix Kapacitor RuleGraph display

### Features

1.  [#873](https://github.com/influxdata/chronograf/pull/873): Add [TLS](https://github.com/influxdata/chronograf/blob/master/docs/tls.md) support
2.  [#885](https://github.com/influxdata/chronograf/issues/885): Add presentation mode to the dashboard page
3.  [#891](https://github.com/influxdata/chronograf/issues/891): Make dashboard visualizations draggable
4.  [#892](https://github.com/influxdata/chronograf/issues/891): Make dashboard visualizations resizable
5.  [#893](https://github.com/influxdata/chronograf/issues/893): Persist dashboard visualization position
6.  [#922](https://github.com/influxdata/chronograf/issues/922): Additional OAuth2 support for [Heroku](https://github.com/influxdata/chronograf/blob/master/docs/auth.md#heroku) and [Google](https://github.com/influxdata/chronograf/blob/master/docs/auth.md#google)
7.  [#781](https://github.com/influxdata/chronograf/issues/781): Add global auto-refresh dropdown to all graph dashboards

### UI Improvements

1.  [#905](https://github.com/influxdata/chronograf/pull/905): Make scroll bar thumb element bigger
2.  [#917](https://github.com/influxdata/chronograf/pull/917): Simplify the sidebar
3.  [#920](https://github.com/influxdata/chronograf/pull/920): Display stacked and step plot graph types
4.  [#851](https://github.com/influxdata/chronograf/pull/851): Add configuration for [InfluxEnterprise](https://portal.influxdata.com/) meta nodes
5.  [#916](https://github.com/influxdata/chronograf/pull/916): Dynamically scale font size based on resolution

## v1.2.0-beta3 [2017-02-15]

### Bug Fixes

1.  [#879](https://github.com/influxdata/chronograf/pull/879): Fix several Kapacitor configuration page state bugs: [#875](https://github.com/influxdata/chronograf/issues/875), [#876](https://github.com/influxdata/chronograf/issues/876), [#878](https://github.com/influxdata/chronograf/issues/878)
2.  [#872](https://github.com/influxdata/chronograf/pull/872): Fix incorrect data source response

### Features

1.  [#896](https://github.com/influxdata/chronograf/pull/896) Add more docker stats

## v1.2.0-beta2 [2017-02-10]

### Bug Fixes

1.  [#865](https://github.com/influxdata/chronograf/issues/865): Support for String fields compare Kapacitor rules in Chronograf UI

### Features

1.  [#838](https://github.com/influxdata/chronograf/issues/838): Add [detail node](https://docs.influxdata.com/kapacitor/latest/nodes/alert_node/#details) to Kapacitor alerts
2.  [#847](https://github.com/influxdata/chronograf/issues/847): Enable and disable Kapacitor alerts from the alert manager page
3.  [#853](https://github.com/influxdata/chronograf/issues/853): Update builds to use yarn over npm install
4.  [#860](https://github.com/influxdata/chronograf/issues/860): Add gzip encoding and caching of static assets to server
5.  [#864](https://github.com/influxdata/chronograf/issues/864): Add support to Kapacitor rule alert configuration for:
    - HTTP
    - TCP
    - Exec
    - SMTP
    - Alerta

### UI Improvements

1.  [#822](https://github.com/influxdata/chronograf/issues/822): Simplify and improve the layout of the Data Explorer
    - The Data Explorer's intention and purpose has always been the ad hoc and ephemeral exploration of your schema and data.
      The concept of `Exploration` sessions and `Panels` betrayed this initial intention. The DE turned into a "poor man's"
      dashboarding tool. In turn, this introduced complexity in the code and the UI. In the future if I want to save, manipulate,
      and view multiple visualizations this will be done more efficiently and effectively in our dashboarding solution.

## v1.2.0-beta1 [2017-01-27]

### Bug Fixes

1.  [#788](https://github.com/influxdata/chronograf/pull/788): Fix missing fields in data explorer when using non-default retention policy
2.  [#774](https://github.com/influxdata/chronograf/issues/774): Fix gaps in layouts for hosts

### Features

1.  [#779](https://github.com/influxdata/chronograf/issues/779): Add layout for telegraf's diskio system plugin
2.  [#810](https://github.com/influxdata/chronograf/issues/810): Add layout for telegraf's net system plugin
3.  [#811](https://github.com/influxdata/chronograf/issues/811): Add layout for telegraf's procstat plugin
4.  [#737](https://github.com/influxdata/chronograf/issues/737): Add GUI for OpsGenie kapacitor alert service
5.  [#814](https://github.com/influxdata/chronograf/issues/814): Allows Chronograf to be mounted under any arbitrary URL path using the `--basepath` flag.

## v1.1.0-beta6 [2017-01-13]

### Bug Fixes

1.  [#748](https://github.com/influxdata/chronograf/pull/748): Fix missing kapacitors on source index page
2.  [#755](https://github.com/influxdata/chronograf/pull/755): Fix kapacitor basic auth proxying
3.  [#704](https://github.com/influxdata/chronograf/issues/704): Fix RPM and DEB install script and systemd unit file

### Features

1.  [#660](https://github.com/influxdata/chronograf/issues/660): Add option to accept any certificate from InfluxDB
2.  [#733](https://github.com/influxdata/chronograf/pull/733): Add optional Github organization membership checks to authentication
3.  [#564](https://github.com/influxdata/chronograf/issues/564): Add RabbitMQ pre-canned layout
4.  [#706](https://github.com/influxdata/chronograf/issues/706): Alerts on threshold where value is inside of range
5.  [#707](https://github.com/influxdata/chronograf/issues/707): Alerts on threshold where value is outside of range
6.  [#772](https://github.com/influxdata/chronograf/pull/772): Add X-Chronograf-Version header to all requests

### UI Improvements

1.  [#766](https://github.com/influxdata/chronograf/pull/766): Add click-to-insert functionality to rule message templates

## v1.1.0-beta5 [2017-01-05]

### Bug Fixes

1.  [#693](https://github.com/influxdata/chronograf/issues/693): Fix corrupted MongoDB pre-canned layout
2.  [#714](https://github.com/influxdata/chronograf/issues/714): Relative rules check data in the wrong direction
3.  [#718](https://github.com/influxdata/chronograf/issues/718): Fix bug that stopped apps from displaying

## v1.1.0-beta4 [2016-12-30]

### Features

1.  [#691](https://github.com/influxdata/chronograf/issues/691): Add server-side dashboard API
2.  [#709](https://github.com/influxdata/chronograf/pull/709): Add kapacitor range alerting to API
3.  [#672](https://github.com/influxdata/chronograf/pull/672): Added visual indicator for down hosts
4.  [#612](https://github.com/influxdata/chronograf/issues/612): Add dashboard menu

### Bug Fixes

1.  [679](https://github.com/influxdata/chronograf/issues/679): Fix version display

## v1.1.0-beta3 [2016-12-16]

### Features

1.  [#610](https://github.com/influxdata/chronograf/issues/610): Add ability to edit raw text queries in the Data Explorer

### UI Improvements

1.  [#688](https://github.com/influxdata/chronograf/issues/688): Add ability to visually distinguish queries in the Data Explorer
1.  [#618](https://github.com/influxdata/chronograf/issues/618): Add measurement name and field key to the query tab in the Data Explorer
1.  [#698](https://github.com/influxdata/chronograf/issues/698): Add color differentiation for Kapacitor alert levels
1.  [#698](https://github.com/influxdata/chronograf/issues/698): Clarify an empty Kapacitor configuration on the InfluxDB Sources page
1.  [#676](https://github.com/influxdata/chronograf/issues/676): Streamline the function selector in the Data Explorer

### Bug Fixes

1.  [#652](https://github.com/influxdata/chronograf/issues/652),[#670](https://github.com/influxdata/chronograf/issues/670): Allow text selecting in text box inputs
2.  [#679](https://github.com/influxdata/chronograf/issues/679): Add version information to the nightly builds
3.  [#675](https://github.com/influxdata/chronograf/issues/675): Fix user flow for Kapacitor connect

## v1.1.0-beta2 [2016-12-09]

### Features

1.  [#624](https://github.com/influxdata/chronograf/issues/624): Add time range selection to kapacitor alert rules
1.  Update Go to 1.7.4

### Bug Fixes

1.  [#664](https://github.com/influxdata/chronograf/issues/664): Fix Content-Type of single-page app to always be text/html
1.  [#671](https://github.com/influxdata/chronograf/issues/671): Fix multiple influxdb source freezing page

## v1.1.0-beta1 [2016-12-06]

### Layouts

1.  [#575](https://github.com/influxdata/chronograf/issues/556): Varnish Layout
2.  [#535](https://github.com/influxdata/chronograf/issues/535): Elasticsearch Layout

### Features

1.  [#565](https://github.com/influxdata/chronograf/issues/565) [#246](https://github.com/influxdata/chronograf/issues/246) [#234](https://github.com/influxdata/chronograf/issues/234) [#311](https://github.com/influxdata/chronograf/issues/311) Github Oauth login
2.  [#487](https://github.com/influxdata/chronograf/issues/487): Warn users if they are using a kapacitor instance that is configured to use an influxdb instance that does not match the current source
3.  [#597](https://github.com/influxdata/chronograf/issues/597): Filter host by series tags
4.  [#568](https://github.com/influxdata/chronograf/issues/568): [#569](https://github.com/influxdata/chronograf/issues/569): Add support for multiple y-axis, labels, and ranges
5.  [#605](https://github.com/influxdata/chronograf/issues/605): Singlestat visualization type in host view
6.  [#607](https://github.com/influxdata/chronograf/issues/607): Singlestat and line graph visualization type in host view

### Bug Fixes

1.  [#536](https://github.com/influxdata/chronograf/issues/536) Redirect the user to the kapacitor config screen if they are attempting to view or edit alerts without a configured kapacitor
2.  [#539](https://github.com/influxdata/chronograf/issues/539) Zoom works only on the first graph of a layout
3.  [#494](https://github.com/influxdata/chronograf/issues/494) Layouts should only be displayed when the measurement is present
4.  [#588](https://github.com/influxdata/chronograf/issues/588) Unable to connect to source
5.  [#586](https://github.com/influxdata/chronograf/issues/586) Allow telegraf database in non-default locations
6.  [#542](https://github.com/influxdata/chronograf/issues/542) Graphs in layouts do not show up in the order of the layout definition
7.  [#574](https://github.com/influxdata/chronograf/issues/574): Fix broken graphs on Postgres Layouts by adding aggregates
8.  [#644](https://github.com/influxdata/chronograf/pull/644): Fix bug that stopped apps from displaying
9.  [#510](https://github.com/influxdata/chronograf/issues/510): Fix connect button

## v1.1-alpha [2016-11-14]

### Release Notes

This is the initial alpha release of Chronograf 1.1.
