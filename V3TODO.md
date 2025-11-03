# InfluxDB v3 support TODOs

## Features

- [X] Support InfluxDB 3 Serverless
- [ ] UI should have old UI look for default
  - [ ] Enable new UI look from settings

## Issues

- [ ] List databases for Core in Explorer shows fewer dbs than with `show databases` manually
- [X] Command line help print-out wrongly formated due to new v3 option:
```
/influxdb-type:choice[influx|influx-enterprise|influx-relay|influx-v2|influx-v3-core|influx-v3-enterprise|influx-v3-cloud-dedicated]  
```

## Tests

- [X] Unit test for Update Source for cloud dedicated fields
- [X] Unit test for New Source for cloud dedicate fields
- [X] Unit test for Client cloud dedicated fields
- [ ] Unit test for query specific cloud dedicated fields
- [ ] After finalizing UI, fix Cypress tests
 
## Polishing
- [ ] Handle TODOs in code
- [ ] Once all 5 v3 influxdb types are supported reorganize/refactor the code (cloud_dedicated.go, influx.go) to group similar server types

## Enhancements
- [ ] UI: Better form validation to show errored field(s)
- [ ] UI: distinguish optional fields
