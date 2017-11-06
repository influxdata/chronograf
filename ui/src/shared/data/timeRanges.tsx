export default [
  {defaultGroupBy: '10s', seconds: 300, inputValue: 'Past 5 minutes', lower: 'now() - 5m', upper: null, menuOption: 'Past 5 minutes'},
  {defaultGroupBy: '1m', seconds: 900, inputValue: 'Past 15 minutes', lower: 'now() - 15m', upper: null, menuOption: 'Past 15 minutes'},
  {defaultGroupBy: '1m', seconds: 3600, inputValue: 'Past hour', lower: 'now() - 1h', upper: null, menuOption: 'Past hour'},
  {defaultGroupBy: '1m', seconds: 21600, inputValue: 'Past 6 hours', lower: 'now() - 6h', upper: null, menuOption: 'Past 6 hours'},
  {defaultGroupBy: '5m',  seconds: 43200, inputValue: 'Past 12 hours', lower: 'now() - 12h', upper: null, menuOption: 'Past 12 hours'},
  {defaultGroupBy: '10m', seconds: 86400, inputValue: 'Past 24 hours', lower: 'now() - 24h', upper: null, menuOption: 'Past 24 hours'},
  {defaultGroupBy: '30m', seconds: 172800, inputValue: 'Past 2 days', lower: 'now() - 2d', upper: null, menuOption: 'Past 2 days'},
  {defaultGroupBy: '1h', seconds: 604800, inputValue: 'Past 7 days', lower: 'now() - 7d', upper: null, menuOption: 'Past 7 days'},
  {defaultGroupBy: '6h', seconds: 2592000, inputValue: 'Past 30 days', lower: 'now() - 30d', upper: null, menuOption: 'Past 30 days'},
]
