import React from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {changeSelectedDBs} from 'src/admin/actions/influxdb'
import {MultiSelectDropdown} from 'src/reusable_ui'
import {Database} from 'src/types/influxAdmin'

interface ConnectedProps {
  databases: Database[]
  selectedDBs: string[]
}
const mapStateToProps = ({adminInfluxDB: {databases, selectedDBs}}) => ({
  databases,
  selectedDBs,
})
const mapDispatchToProps = {
  setSelectedDBs: changeSelectedDBs,
}
type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = ConnectedProps & ReduxDispatchProps
const MultiDBSelector = ({databases, selectedDBs, setSelectedDBs}: Props) => {
  return (
    <div className="db-selector">
      <MultiSelectDropdown
        onChange={setSelectedDBs}
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

export default connect(mapStateToProps, mapDispatchToProps)(MultiDBSelector)
