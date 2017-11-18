import * as React from 'react'
import DatabaseDropdown from 'shared/components/DatabaseDropdown'

import {Source} from 'src/types'

export interface WriteDataHeaderProps {
  isManual: boolean
  selectedDatabase: string
  handleSelectDatabase: ({text}: {text: string}) => void
  toggleWriteView: (toggle: boolean) => () => void
  errorThrown: (error: string) => void
  onClose: () => void
  source: Source
}

const WriteDataHeader: React.SFC<WriteDataHeaderProps> = ({
  handleSelectDatabase,
  selectedDatabase,
  errorThrown,
  toggleWriteView,
  isManual,
  onClose,
  source,
}) => (
  <div className="write-data-form--header">
    <div className="page-header__left">
      <h1 className="page-header__title">Write Data To</h1>
      <DatabaseDropdown
        onSelectDatabase={handleSelectDatabase}
        database={selectedDatabase}
        onErrorThrown={errorThrown}
        source={source}
      />
      <ul className="nav nav-tablist nav-tablist-sm">
        <li
          onClick={toggleWriteView(false)}
          className={isManual ? '' : 'active'}
        >
          File Upload
        </li>
        <li
          onClick={toggleWriteView(true)}
          className={isManual ? 'active' : ''}
          data-test="manual-entry-button"
        >
          Manual Entry
        </li>
      </ul>
    </div>
    <div className="page-header__right">
      <span className="page-header__dismiss" onClick={onClose} />
    </div>
  </div>
)

export default WriteDataHeader
