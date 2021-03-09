import AJAX from 'src/utils/ajax'

export const getUsers = async url => {
  try {
    return await AJAX({
      method: 'GET',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getRoles = async url => {
  try {
    return await AJAX({
      method: 'GET',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getPermissions = async url => {
  try {
    return await AJAX({
      method: 'GET',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const getDbsAndRps = async url => {
  try {
    return await AJAX({
      method: 'GET',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createUser = async (url, user) => {
  return await AJAX({
    method: 'POST',
    url,
    data: user,
  })
}

export const createRole = async (url, role) => {
  return await AJAX({
    method: 'POST',
    url,
    data: role,
  })
}

export const createDatabase = async (url, database) => {
  return await AJAX({
    method: 'POST',
    url,
    data: database,
  })
}

export const createRetentionPolicy = async (url, retentionPolicy) => {
  return await AJAX({
    method: 'POST',
    url,
    data: retentionPolicy,
  })
}

export const deleteRetentionPolicy = async url => {
  return await AJAX({
    method: 'DELETE',
    url,
  })
}

export const deleteRole = async url => {
  try {
    return await AJAX({
      method: 'DELETE',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteUser = async url => {
  try {
    return await AJAX({
      method: 'DELETE',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const deleteDatabase = async url => {
  try {
    return await AJAX({
      method: 'DELETE',
      url,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateRole = async (url, users, permissions) => {
  try {
    return await AJAX({
      method: 'PATCH',
      url,
      data: {
        users,
        permissions,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateUser = async (url, updates) => {
  try {
    return await AJAX({
      method: 'PATCH',
      url,
      data: updates,
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const updateRetentionPolicy = async (url, retentionPolicy) => {
  try {
    return await AJAX({
      method: 'PUT',
      url,
      data: {
        ...retentionPolicy,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
