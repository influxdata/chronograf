export const PERMISSIONS = {
  ViewAdmin: {
    description: 'Can view or edit admin screens',
    displayName: 'View Admin',
  },
  ViewChronograf: {
    description: 'Can use Chronograf tools',
    displayName: 'View Chronograf',
  },
  CreateDatabase: {
    description: 'Can create databases',
    displayName: 'Create Databases',
  },
  CreateUserAndRole: {
    description: 'Can create users and roles',
    displayName: 'Create Users & Roles',
  },
  AddRemoveNode: {
    description: 'Can add/remove nodes from a cluster',
    displayName: 'Add/Remove Nodes',
  },
  DropDatabase: {
    description: 'Can drop databases',
    displayName: 'Drop Databases',
  },
  DropData: {
    displayName: 'Drop Data',
    description: 'Can drop measurement and series queries',
  },
  ReadData: {
    displayName: 'Read',
    description: 'Can read data',
  },
  WriteData: {
    displayName: 'Write',
    description: 'Can write data',
  },
  Rebalance: {
    displayName: 'Rebalance',
    description: 'Can rebalance a cluster',
  },
  ManageShard: {
    displayName: 'Manage Shards',
    description: 'Can copy and delete shards',
  },
  ManageContinuousQuery: {
    displayName: 'Manage Continuous Queries',
    description: 'Can create, show, and drop continuous queries',
  },
  ManageQuery: {
    displayName: 'Manage Queries',
    description: 'Can show and kill queries',
  },
  ManageSubscription: {
    displayName: 'Manage Subscriptions',
    description: 'Can show, add, and drop subscriptions',
  },
  Monitor: {
    displayName: 'Monitor',
    description: 'Can show stats and diagnostics',
  },
  CopyShard: {
    displayName: 'Copy Shard',
    description: 'Can copy shards',
  },
  // TODO: get clarification on this one
  // KapacitorAPI: {
  //   displayName: 'Kapacitor',
  //   description: 'Can access the Kapacitor API',
  // },
}

export const DEFAULT_LINE_COLORS = [
  // 1 Color Palettes
  [['#00C9FF'], ['#00C9FF'], ['#00C9FF']],
  // 2 Color Palettes
  [['#00C9FF', '#00C9FF'], ['#00C9FF', '#00C9FF'], ['#00C9FF', '#00C9FF']],
  // 3 Color Palettes
  [
    ['#00C9FF', '#9394FF', '#4ED8A0'],
    ['#00C9FF', '#9394FF', '#4ED8A0'],
    ['#00C9FF', '#9394FF', '#4ED8A0'],
  ],
  // 4 Color Palettes
  [
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054'],
  ],
  // 5 Color Palettes
  [
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00'],
  ],
  // 6 Color Palettes
  [
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00', '#33aa99'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00', '#33aa99'],
    ['#00C9FF', '#9394FF', '#4ED8A0', '#ff0054', '#ffcc00', '#33aa99'],
  ],
  // 7 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
    ],
  ],
  // 8 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
    ],
  ],
  // 9 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
    ],
  ],
  // 10 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
    ],
  ],
  // 11 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
    ],
  ],
  // 12 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
    ],
  ],
  // 13 Color Palettes
  [
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
      '#a0725b',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
      '#a0725b',
    ],
    [
      '#00C9FF',
      '#9394FF',
      '#4ED8A0',
      '#ff0054',
      '#ffcc00',
      '#33aa99',
      '#9dfc5d',
      '#92bcc3',
      '#ca96fb',
      '#ff00f0',
      '#38b94a',
      '#3844b9',
      '#a0725b',
    ],
  ],
]

export const STROKE_WIDTH = {
  heavy: 3.5,
  light: 1.5,
}

export const DROPDOWN_MENU_MAX_HEIGHT = 240

export const HEARTBEAT_INTERVAL = 10000 // ms

export const PRESENTATION_MODE_ANIMATION_DELAY = 0 // In milliseconds.
export const PRESENTATION_MODE_NOTIFICATION_DELAY = 2000 // In milliseconds.

export const SHORT_NOTIFICATION_DISMISS_DELAY = 2000 // in milliseconds

export const REVERT_STATE_DELAY = 1500 // ms

export const HTTP_UNAUTHORIZED = 401
export const HTTP_FORBIDDEN = 403
export const HTTP_NOT_FOUND = 404

export const AUTOREFRESH_DEFAULT = 15000 // in milliseconds

export const GRAPH = 'graph'
export const TABLE = 'table'
export const VIS_VIEWS = [GRAPH, TABLE]

// InfluxQL Macros
export const TEMP_VAR_INTERVAL = ':interval:'
export const INITIAL_GROUP_BY_TIME = '10s'
export const AUTO_GROUP_BY = 'auto'

export const DEFAULT_HOME_PAGE = 'status'

export const STATUS_PAGE_ROW_COUNT = 10 // TODO: calculate based on actual Status Page cells
export const PAGE_HEADER_HEIGHT = 60 // TODO: get this dynamically to ensure longevity
export const PAGE_CONTAINER_MARGIN = 30 // TODO: get this dynamically to ensure longevity
export const LAYOUT_MARGIN = 4
export const DASHBOARD_LAYOUT_ROW_HEIGHT = 83.5

export const DEFAULT_SOURCE = {
  url: 'http://localhost:8086',
  name: 'Influx 1',
  username: '',
  password: '',
  default: true,
  telegraf: 'telegraf',
  insecureSkipVerify: false,
  metaUrl: '',
}
