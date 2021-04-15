export const NEW_DEFAULT_USER = {
  name: '',
  password: '',
  roles: [],
  permissions: [],
  links: {self: ''},
  isNew: true,
}

export const NEW_DEFAULT_ROLE = {
  name: '',
  permissions: [],
  users: [],
  links: {self: ''},
  isNew: true,
}

export const NEW_DEFAULT_RP = {
  name: 'autogen',
  duration: '0',
  replication: 2,
  isDefault: true,
  links: {self: ''},
}

export const NEW_EMPTY_RP = {
  name: '',
  duration: '',
  replication: 0,
  links: {self: ''},
  isNew: true,
}

export const NEW_DEFAULT_DATABASE = {
  name: '',
  isNew: true,
  retentionPolicies: [NEW_DEFAULT_RP],
}
