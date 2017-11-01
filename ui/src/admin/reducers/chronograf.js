const initialState = {
  users: [],
  organizations: [],
}

import {DUMMY_USERS} from 'src/admin/constants/dummyUsers'

const adminChronograf = (state = initialState, action) => {
  switch (action.type) {
    case 'CHRONOGRAF_LOAD_USERS': {
      return {...state, users: [...DUMMY_USERS]}
    }
  }

  return state
}

export default adminChronograf
