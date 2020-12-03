import React, {FunctionComponent} from 'react'

import classnames from 'classnames'

import {Namespace} from 'src/types/queries'

export interface DatabaseListItemProps {
  isActive: boolean
  namespace: Namespace
  onChooseNamespace: (namespace: Namespace) => () => void
}

const DatabaseListItem: FunctionComponent<DatabaseListItemProps> = ({
  isActive,
  namespace,
  namespace: {database, retentionPolicy},
  onChooseNamespace,
}) => (
  <div
    className={classnames('query-builder--list-item', {
      active: isActive,
    })}
    onClick={onChooseNamespace(namespace)}
  >
    {database}.{retentionPolicy}
  </div>
)

export default DatabaseListItem
