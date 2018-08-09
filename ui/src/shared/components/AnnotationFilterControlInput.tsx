import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'

import {ClickOutside} from 'src/shared/components/ClickOutside'

interface Props {
  value: string
  suggestions: string[]
  onChange: (newValue: string) => void
  onSelect: (newValue: string) => void
  onFocus: () => void
  inputClass?: string
}

interface State {
  selectionIndex: number | null
  areSuggestionsVisible: boolean
  filteredSuggestions: string[]
}

const NUM_SUGGESTIONS = 8

class AnnotationFilterControlInput extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props: Props) {
    const {suggestions, value} = props

    const filtered: string[] = suggestions.filter(
      (v, i) => v.includes(value) && i < NUM_SUGGESTIONS
    )
    const unique: string[] = [...new Set(filtered)]

    unique.sort((a, b) => a.localeCompare(b))

    return {filteredSuggestions: unique}
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      filteredSuggestions: props.suggestions,
      selectionIndex: 0,
      areSuggestionsVisible: false,
    }
  }

  public render() {
    const {value} = this.props

    return (
      <ClickOutside onClickOutside={this.handleClickOutside}>
        <div className="suggestion-input">
          <input
            className={this.inputClass}
            value={value}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onKeyUp={this.handleKeyUp}
          />
          <div
            className={`suggestion-input--suggestions dropdown-menu ${
              this.suggestionsClass
            }`}
          >
            {this.suggestionDropdownItems}
          </div>
        </div>
      </ClickOutside>
    )
  }

  private get suggestionDropdownItems() {
    const {onSelect} = this.props
    const {selectionIndex, filteredSuggestions} = this.state

    return filteredSuggestions.map((v, i) => {
      const selectedClass = i === selectionIndex ? 'selected' : ''
      const onClick = () => {
        onSelect(v)
        this.setState({areSuggestionsVisible: false})
      }

      return (
        <div
          key={v}
          className={`suggestion-input-suggestion dropdown-item ${selectedClass}`}
          onClick={onClick}
        >
          {v}
        </div>
      )
    })
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.props.onChange(e.target.value)
  }

  private handleFocus = () => {
    this.setState({areSuggestionsVisible: true})

    this.props.onFocus()
  }

  private handleClickOutside = () => {
    this.setState({areSuggestionsVisible: false})
  }

  private handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    const {key, ctrlKey} = e

    if (key === 'Enter') {
      const {onSelect} = this.props
      const {selectionIndex, filteredSuggestions} = this.state

      e.currentTarget.blur()
      onSelect(filteredSuggestions[selectionIndex])
      this.setState({areSuggestionsVisible: false})
    } else if (
      key === 'ArrowDown' ||
      (ctrlKey && (key === 'j' || key === 'n')) // emacs and vim bindings
    ) {
      this.incrementSelectionIndex(1)
    } else if (key === 'ArrowUp' || (ctrlKey && (key === 'k' || key === 'p'))) {
      this.incrementSelectionIndex(-1)
    }
  }

  private incrementSelectionIndex = (di: number): void => {
    const {filteredSuggestions} = this.state

    let selectionIndex = this.state.selectionIndex + di

    if (selectionIndex < 0) {
      selectionIndex = 0
    }

    if (selectionIndex >= filteredSuggestions.length) {
      selectionIndex = filteredSuggestions.length - 1
    }

    this.setState({selectionIndex})
  }

  private get suggestionsClass(): string {
    return this.state.areSuggestionsVisible ? '' : 'hidden'
  }

  private get inputClass(): string {
    const {inputClass} = this.props

    return `suggestion-input--input form-control ${
      inputClass ? inputClass : ''
    }`
  }
}

export default AnnotationFilterControlInput
