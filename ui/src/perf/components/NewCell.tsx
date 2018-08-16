import React, {PureComponent} from 'react'
import {AutoSizer} from 'react-virtualized'

import Vis from 'src/perf/components/Vis'
import {
  Button,
  ButtonShape,
  Dropdown,
  IconFont,
  ComponentSize,
  ComponentColor,
} from 'src/reusable_ui'

import QueryManager from 'src/perf/QueryManager'

interface Props {
  queryManager: QueryManager
}

interface State {
  isEditing: boolean
  timezone: string
  curve: string
}

const TIMEZONES = [
  'Etc/UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
]

const CURVES = ['Linear', 'Step', 'Smooth']

class NewCell extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {isEditing: false, timezone: 'Etc/UTC', curve: 'Linear'}
  }

  public render() {
    const {queryManager} = this.props
    const {isEditing, timezone, curve} = this.state

    return (
      <div className="perf-cell">
        <div className="perf-cell--header perf-test-page--draggable">
          <Button
            onClick={this.handleToggleEditing}
            shape={ButtonShape.Square}
            icon={isEditing ? IconFont.Remove : IconFont.CogThick}
            size={ComponentSize.ExtraSmall}
            color={ComponentColor.Default}
          />
        </div>
        <div className="perf-cell--body">
          <div className="perf-cell--vis-container">
            <AutoSizer>
              {({width, height}) => (
                <Vis
                  queryManager={queryManager}
                  width={width}
                  height={height}
                  timezone={timezone}
                  curve={curve}
                />
              )}
            </AutoSizer>
          </div>
          {isEditing && (
            <div className="perf-cell--settings">
              <div className="perf-cell--setting">
                <label>Timezone</label>
                <Dropdown
                  selectedID={timezone}
                  onChange={this.handleChangeTimezone}
                >
                  {TIMEZONES.map(tz => (
                    <Dropdown.Item id={tz} value={tz}>
                      {tz}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
              </div>
              <div className="perf-cell--setting">
                <label>Line Style</label>
                <Dropdown selectedID={curve} onChange={this.handleChangeCurve}>
                  {CURVES.map(curve => (
                    <Dropdown.Item id={curve} value={curve}>
                      {curve}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  private handleToggleEditing = () => {
    this.setState({isEditing: !this.state.isEditing})
  }

  private handleChangeTimezone = timezone => {
    this.setState({timezone, isEditing: false})
  }

  private handleChangeCurve = curve => {
    this.setState({curve, isEditing: false})
  }
}

export default NewCell
