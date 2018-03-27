import React, {
    PureComponent,
    FocusEvent,
    ChangeEvent,
    KeyboardEvent,
} from 'react'

import classnames from 'classnames'

import Dropdown from 'src/shared/components/Dropdown'

import {NULL_STRING, NUMBER} from 'src/shared/constants/queryFillOptions'

import queryFills from 'src/loudml/constants/queryFills'

interface Props {
    onChooseFill: (item: string) => void
    value: string
    size?: string
    theme?: string
    disabled?: boolean
}

interface FillType {
    text: string
    type: string
}

interface State {
    selected: FillType
    currentNumberValue: string
    resetNumberValue: string
}

class FillFeature extends PureComponent<Props, State> {

    public static defaultProps: Partial<Props> = {
        size: 'sm',
        theme: 'blue',
        value: NULL_STRING,
        // disabled: false,
    }
    
    private numberInput: HTMLElement
    
    constructor(props) {
        super(props)
        
        const isNumberValue = !isNaN(Number(props.value))

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

    public render() {
        const {size, theme, disabled} = this.props
        const {selected, currentNumberValue} = this.state

        return (
            <div className="input-group">
                <div className={classnames({
                    'input-group-prepend': selected.type === NUMBER,
                    })}>
                    <Dropdown
                        selected={selected.text}
                        items={queryFills}
                        className="dropdown-100"
                        buttonSize={`btn-${size}`}
                        onChoose={this.handleDropdown}
                        disabled={disabled}
                        />
                </div>
                {selected.type === NUMBER && (
                    <div className="input-group-append">
                        <input
                            ref={r => (this.numberInput = r)}
                            type="number"
                            className={`form-control monotype form-${this.getColor(
                                theme
                            )} input-${size} input-group-text`}
                            placeholder="Custom Value"
                            value={currentNumberValue}
                            onKeyUp={this.handleKeyUp}
                            onKeyDown={this.handleKeyDown}
                            onChange={this.handleInputChange}
                            onBlur={this.handleInputBlur}
                            disabled={disabled}
                            />
                    </div>
                )}
            </div>
        )
    }

    private handleDropdown = (item: FillType): void => {
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

    private handleInputBlur = (e: FocusEvent<HTMLInputElement>): void => {
        const nextNumberValue = e.target.value
            ? e.target.value
            : this.state.resetNumberValue || '0'

        this.setState({
            currentNumberValue: nextNumberValue,
            resetNumberValue: nextNumberValue,
        })

        this.props.onChooseFill(nextNumberValue)
    }

    private handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const currentNumberValue = e.target.value

        this.setState({currentNumberValue})
    }

    private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            this.numberInput.blur()
        }
    }

    private handleKeyUp = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Escape') {
            this.setState({currentNumberValue: this.state.resetNumberValue}, () => {
                this.numberInput.blur()
            })
        }
    }

    private getColor = (theme: string) => {
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

}

export default FillFeature
