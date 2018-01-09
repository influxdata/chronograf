import * as _ from 'lodash'
import {fieldWalk} from 'src/shared/reducers/helpers/fields'

import {PERMISSIONS} from 'shared/constants'

export function buildRoles(roles) {
  return roles.map(role => {
    return Object.assign({}, role, {
      permissions: buildPermissionsWithResources(role.permissions),
      users: role.users || [],
    })
  })
}

function buildPermissionsWithResources(rawPermissions) {
  const nextPermissions = {}
  _.each(rawPermissions, (permissions, resource) => {
    permissions.forEach(p => {
      if (nextPermissions[p]) {
        nextPermissions[p].push(resource)
      } else {
        nextPermissions[p] = [resource]
      }
    })
  })

  return _.map(nextPermissions, (resources, permissionName) => {
    if (!PERMISSIONS[permissionName]) {
      console.error('Could not find details for plutonium permission!')
      return {
        name: permissionName,
        displayName: '',
        description: '',
        resources,
      }
    }

    const {displayName, description} = PERMISSIONS[permissionName]
    return {
      name: permissionName,
      displayName,
      description,
      resources,
    }
  })
}

// Builds permissions from a static list instead of converting raw plutonium
// permissions. Used when a list of all available permissions is needed.
export function buildAllPermissions() {
  return _.map(PERMISSIONS, ({displayName, description}, permissionName) => {
    if (!PERMISSIONS[permissionName]) {
      console.error('Could not find details for plutonium permission!')
      return {
        name: permissionName,
        displayName: '',
        description: '',
        resources: [],
      }
    }

    return {
      name: permissionName,
      displayName,
      description,
      resources: [],
    }
  })
}

// Takes a single permission name/list of resources and returns an object
// with more detail like a description and display name.
export function buildPermission(permissionName, resources) {
  if (!PERMISSIONS[permissionName]) {
    console.error('Could not find details for plutonium permission!')
    return {
      name: permissionName,
      displayName: '',
      description: '',
      resources: [],
    }
  }

  return Object.assign(
    {},
    {
      name: permissionName,
      resources,
    },
    PERMISSIONS[permissionName]
  )
}

export function buildClusterAccounts(users = [], roles = []) {
  return users.map(user => {
    return Object.assign({}, user, {
      roles: getRolesForUser(roles, user),
      permissions: buildPermissionsWithResources(user.permissions),
    })
  })
}

function getRolesForUser(roles, user) {
  const userRoles = roles.filter(role => {
    if (!role.users) {
      return false
    }
    return role.users.includes(user.name)
  })

  return buildRoles(userRoles)
}

export const buildDefaultYLabel = queryConfig => {
  const {measurement} = queryConfig
  const fields = _.get(queryConfig, ['fields', '0'], [])
  const isEmpty = !measurement && !fields.length

  if (isEmpty) {
    return ''
  }

  const walkZerothArgs = f => {
    if (f.type === 'field') {
      return f.value
    }

    return `${f.value}${_.get(f, ['0', 'args', 'value'], '')}`
  }

  const values = fieldWalk([fields], walkZerothArgs)

  return `${measurement}.${values.join('_')}`
}
