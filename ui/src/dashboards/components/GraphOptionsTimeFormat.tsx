import React, {PureComponent} from 'react'

import {Dropdown} from 'src/reusable_ui'
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'
import {
  FORMAT_OPTIONS,
  TIME_FORMAT_CUSTOM,
  DEFAULT_TIME_FORMAT,
  TIME_FORMAT_TOOLTIP_LINK,
} from 'src/dashboards/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  timeFormat: string
  onTimeFormatChange: (format: string) => void
}

interface State {
  customFormat: boolean
  format: string
}

@ErrorHandling
class GraphOptionsTimeFormat extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      customFormat: false,
      format: this.props.timeFormat || DEFAULT_TIME_FORMAT,
    }
  }

  get onTimeFormatChange() {
    return this.props.onTimeFormatChange
  }

  public handleChangeFormat = e => {
    const format = e.target.value
    this.onTimeFormatChange(format)
    this.setState({format})
  }

  public handleChooseFormat = (format: string) => {
    if (format === TIME_FORMAT_CUSTOM) {
      this.setState({customFormat: true})
    } else {
      this.onTimeFormatChange(format)
      this.setState({format, customFormat: false})
    }
  }

  public render() {
    const {format, customFormat} = this.state
    const tipContent = `For information on formatting, see <br/><a href="#">${TIME_FORMAT_TOOLTIP_LINK}</a>`

    const formatOption = FORMAT_OPTIONS.find(op => op.format === format)
    const showCustom = !formatOption || customFormat

    return (
      <div className="form-group col-xs-6">
        <label>
          Time Format
          {showCustom && (
            <a href={TIME_FORMAT_TOOLTIP_LINK} target="_blank">
              <QuestionMarkTooltip
                tipID="Time Axis Format"
                tipContent={tipContent}
              />
            </a>
          )}
        </label>
        <Dropdown
          selectedID={showCustom ? TIME_FORMAT_CUSTOM : format}
          onChange={this.handleChooseFormat}
          customClass="dropdown-stretch"
        >
          {FORMAT_OPTIONS.map(({text, format: optionFormat}) => (
            <Dropdown.Item
              key={optionFormat}
              id={optionFormat}
              value={optionFormat}
            >
              {text ? text : optionFormat}
            </Dropdown.Item>
          ))}
        </Dropdown>
        {showCustom && (
          <input
            type="text"
            spellCheck={false}
            placeholder="Enter custom format..."
            value={format}
            data-test="custom-time-format"
            className="form-control input-sm custom-time-format"
            onChange={this.handleChangeFormat}
          />
        )}
      </div>
    )
  }
}

export default GraphOptionsTimeFormat
