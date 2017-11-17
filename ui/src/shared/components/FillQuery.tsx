import * as React from 'react'
import * as _ from 'lodash'

import Dropdown from 'shared/components/Dropdown'
import {NULL_STRING, NUMBER} from 'shared/constants/queryFillOptions'
import queryFills, {QueryFill} from 'shared/data/queryFills'

export interface FillQueryProps {
  onChooseFill: (fill: string) => void
  value: string
  size?: string
  theme?: string
}

export interface FillQueryState {
  selected: QueryFill
  currentNumberValue: string
  resetNumberValue: string
}

class FillQuery extends React.Component<FillQueryProps, FillQueryState> {
  private numberInput

  constructor(props: FillQueryProps) {
    super(props)

    const isNumberValue = _.isNumber(props.value)

    this.state = isNumberValue
      ? {
          selected: queryFills.find(fill => fill.type === NUMBER),
          currentNumberValue: props.value,
          resetNumberValue: props.value,
        }
      : {
          selected: queryFills.find(fill => fill.type === props.value),
          currentNumberValue: '0',
          resetNumberValue: '0',
        }
  }

  private handleDropdown = item => {
    if (item.text === NUMBER) {
      this.setState({selected: item}, () => {
        this.numberInput.focus()
      })
    } else {
      this.setState({selected: item}, () => {
        this.props.onChooseFill(item.text)
      })
    }
  }

  private handleInputBlur = e => {
    const nextNumberValue = e.target.value
      ? e.target.value
      : this.state.resetNumberValue || '0'

    this.setState({
      currentNumberValue: nextNumberValue,
      resetNumberValue: nextNumberValue,
    })

    this.props.onChooseFill(nextNumberValue)
  }

  private handleInputChange = e => {
    const currentNumberValue = e.target.value

    this.setState({currentNumberValue})
  }

  private handleKeyDown = e => {
    if (e.key === 'Enter') {
      this.numberInput.blur()
    }
  }

  private handleKeyUp = e => {
    if (e.key === 'Escape') {
      this.setState({currentNumberValue: this.state.resetNumberValue}, () => {
        this.numberInput.blur()
      })
    }
  }

  private getColor = theme => {
    switch (theme) {
      case 'BLUE':
        return 'plutonium'
      case 'GREEN':
        return 'malachite'
      case 'PURPLE':
        return 'astronaut'
      default:
        return 'plutonium'
    }
  }

  public static defaultProps = () => ({
    size: 'sm',
    theme: 'blue',
    value: NULL_STRING,
  })

  public render() {
    const {size, theme} = this.props
    const {selected, currentNumberValue} = this.state

    return (
      <div className={`fill-query fill-query--${size}`}>
        {selected.type === NUMBER && (
          <input
            ref={r => (this.numberInput = r)}
            type="number"
            className={`form-control monotype form-${this.getColor(
              theme
            )} input-${size} fill-query--input`}
            placeholder="Custom Value"
            value={currentNumberValue}
            onKeyUp={this.handleKeyUp}
            onKeyDown={this.handleKeyDown}
            onChange={this.handleInputChange}
            onBlur={this.handleInputBlur}
          />
        )}
        <Dropdown
          selected={selected.text}
          items={queryFills}
          className="fill-query--dropdown dropdown-100"
          buttonSize={`btn-${size}`}
          buttonColor="btn-info"
          menuClass={`dropdown-${this.getColor(theme)}`}
          onChoose={this.handleDropdown}
        />
        <label className="fill-query--label">Fill:</label>
      </div>
    )
  }
}

export default FillQuery
