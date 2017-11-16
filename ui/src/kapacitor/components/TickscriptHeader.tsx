import * as React from 'react'
import {Link} from 'react-router-dom'

import SourceIndicator from 'shared/components/SourceIndicator'
import TickscriptType from 'kapacitor/components/TickscriptType'
import MultiSelectDBDropdown from 'shared/components/MultiSelectDBDropdown'
import TickscriptID, {
  TickscriptStaticID,
} from 'kapacitor/components/TickscriptID'
import {Source, Task} from 'src/types'
import {eFunc} from 'src/types/funcs'

const addName = list => list.map(l => ({...l, name: `${l.db}.${l.rp}`}))

export interface TickscriptHeaderProps {
  task: Task
  source: Source
  onSave: eFunc
  onChangeType: eFunc
  onChangeID: eFunc
  onSelectDbrps: eFunc
  isNewTickscript: boolean
}

const TickscriptHeader: React.SFC<TickscriptHeaderProps> = ({
  task: {id, type, dbrps},
  task,
  source,
  onSave,
  onChangeType,
  onChangeID,
  onSelectDbrps,
  isNewTickscript,
}) => (
  <div className="page-header">
    <div className="page-header__container">
      <div className="page-header__left">
        {isNewTickscript ? (
          <TickscriptID onChangeID={onChangeID} id={id} />
        ) : (
          <TickscriptStaticID id={task.name} />
        )}
      </div>
      <div className="page-header__right">
        <SourceIndicator source={source} />
        <TickscriptType type={type} onChangeType={onChangeType} />
        <MultiSelectDBDropdown
          source={source}
          selectedItems={addName(dbrps)}
          onApply={onSelectDbrps}
        />
        <Link
          className="btn btn-sm btn-default"
          to={`/sources/${source.id}/alert-rules`}
        >
          Cancel
        </Link>
        <button
          className="btn btn-success btn-sm"
          title={id ? '' : 'ID your TICKscript to save'}
          onClick={onSave}
          disabled={!id}
        >
          Save Rule
        </button>
      </div>
    </div>
  </div>
)

export default TickscriptHeader
