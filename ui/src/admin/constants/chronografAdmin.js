import {
  MEMBER_ROLE,
  VIEWER_ROLE,
  EDITOR_ROLE,
  READER_ROLE,
  ADMIN_ROLE,
} from 'src/auth/roles'

export const USER_ROLES = [
  {name: MEMBER_ROLE},
  {name: READER_ROLE},
  {name: VIEWER_ROLE},
  {name: EDITOR_ROLE},
  {name: ADMIN_ROLE},
]

export const DEFAULT_ORG_ID = 'default'
export const DEFAULT_MAPPING_ID = 'default'
