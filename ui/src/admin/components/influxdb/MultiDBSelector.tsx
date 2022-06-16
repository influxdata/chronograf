import React, {useCallback} from 'react'
import allOrParticularSelection from 'src/admin/util/allOrParticularSelection'
import {MultiSelectDropdown} from 'src/reusable_ui'
import {Database} from 'src/types/influxAdmin'

interface Props {
  databases: Database[]
  selectedDBs: string[]
  setSelectedDBs: (changeFn: (oldDBs: string[]) => string[]) => void
}
const MultiDBSelector = ({databases, selectedDBs, setSelectedDBs}: Props) => {
  const changeSelectedDBs = useCallback(
    (newDBs: string[]) =>
      setSelectedDBs((oldDBs: string[]) => {
        return allOrParticularSelection(oldDBs, newDBs)
      }),
    [setSelectedDBs]
  )

  return (
    <div className="db-selector">
      <MultiSelectDropdown
        onChange={changeSelectedDBs}
        selectedIDs={selectedDBs}
        emptyText="<no database>"
      >
        {databases.reduce(
          (acc, db) => {
            acc.push(
              <MultiSelectDropdown.Item
                key={db.name}
                id={db.name}
                value={{id: db.name}}
              >
                {db.name}
              </MultiSelectDropdown.Item>
            )
            return acc
          },
          [
            <MultiSelectDropdown.Item id="*" key="*" value={{id: '*'}}>
              All Databases
            </MultiSelectDropdown.Item>,
            <MultiSelectDropdown.Divider id="" key="" />,
          ]
        )}
      </MultiSelectDropdown>
    </div>
  )
}

export default MultiDBSelector
