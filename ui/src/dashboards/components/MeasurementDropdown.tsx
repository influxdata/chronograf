import * as React from 'react'

import Dropdown from 'shared/components/Dropdown'
import {showMeasurements} from 'shared/apis/metaQuery'
import parsers from 'shared/parsing'
const {measurements: showMeasurementsParser} = parsers
import {Source} from 'src/types'

export interface MeasurementDropdownProps {
  source: Source
  database: string
  measurement: string
  onSelectMeasurement: ({text}: {text: string}) => void
  onStartEdit: () => void
  onErrorThrown: (error: string) => void
}

export interface MeasurementDropdownState {
  measurements: string[]
}

class MeasurementDropdown extends React.Component<
  MeasurementDropdownProps,
  MeasurementDropdownState
> {
  constructor(props: MeasurementDropdownProps) {
    super(props)
    this.state = {
      measurements: [],
    }
  }

  private _getMeasurements = async () => {
    const {
      measurement,
      database,
      onSelectMeasurement,
      onErrorThrown,
      source: {links: {proxy}},
    } = this.props

    try {
      const {data} = await showMeasurements(proxy, database)
      const {measurements} = showMeasurementsParser(data)

      this.setState({measurements})
      const selectedMeasurementText = measurements.includes(measurement)
        ? measurement
        : measurements[0] || 'No measurements'
      onSelectMeasurement({text: selectedMeasurementText})
    } catch (error) {
      console.error(error)
      onErrorThrown(error)
    }
  }

  public componentDidMount() {
    this._getMeasurements()
  }

  public componentDidUpdate(nextProps: MeasurementDropdownProps) {
    if (nextProps.database === this.props.database) {
      return
    }

    this._getMeasurements()
  }

  public render() {
    const {measurements} = this.state
    const {measurement, onSelectMeasurement, onStartEdit} = this.props
    return (
      <Dropdown
        items={measurements.map(text => ({text}))}
        selected={measurement || 'Select Measurement'}
        onChoose={onSelectMeasurement}
        onClick={onStartEdit}
      />
    )
  }
}

export default MeasurementDropdown
