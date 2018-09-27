import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'

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
  shouldShowAllSuggestions: boolean
}

const lexographicOrder = (a: string, b: string) => a.localeCompare(b)

class AnnotationFilterControlInput extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props: Props, state: State) {
    const {suggestions, value} = props
    const {shouldShowAllSuggestions} = state

    let filteredSuggestions = [...suggestions.sort(lexographicOrder)]

    if (shouldShowAllSuggestions) {
      return {filteredSuggestions}
    }

    filteredSuggestions = filteredSuggestions.filter(v => v.includes(value))

    return {filteredSuggestions}
  }

  private input: React.RefObject<HTMLInputElement>
  private hideSuggestionsTimer?: NodeJS.Timer

  constructor(props: Props) {
    super(props)

    this.input = React.createRef<HTMLInputElement>()

    this.state = {
      filteredSuggestions: props.suggestions,
      selectionIndex: 0,
      areSuggestionsVisible: false,
      shouldShowAllSuggestions: false,
    }
  }

  public render() {
    const {value} = this.props

    return (
      <div className="suggestion-input">
        <input
          ref={this.input}
          className={this.inputClass}
          defaultValue={value}
          onChange={this.handleChange}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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
    )
  }

  public componentWillUnmount() {
    clearTimeout(this.hideSuggestionsTimer)
  }

  private get suggestionDropdownItems() {
    const {selectionIndex, filteredSuggestions} = this.state

    return filteredSuggestions.map((v, i) => {
      const selectedClass = i === selectionIndex ? 'selected' : ''
      const onClick = () => this.handleSelect(v)

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
    this.setState({shouldShowAllSuggestions: false})
    this.props.onChange(e.target.value)
  }

  private handleFocus = () => {
    this.setState({
      areSuggestionsVisible: true,
      shouldShowAllSuggestions: true,
    })

    this.props.onFocus()
  }

  private handleBlur = () => {
    // When a user clicks a suggestion in the suggestion list, the input blur
    // event fires first. By not hiding the suggestion list immediately, we
    // allow the click event to fire too and the suggestion to be properly
    // selected
    this.hideSuggestionsTimer = setTimeout(() => {
      this.setState({areSuggestionsVisible: false})
    }, 150)
  }

  private handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    const {key, ctrlKey} = e

    if (key === 'Enter') {
      const {selectionIndex, filteredSuggestions} = this.state
      const newValue =
        filteredSuggestions[selectionIndex] || this.input.current.value

      this.handleSelect(newValue)
    } else if (
      key === 'ArrowDown' ||
      (ctrlKey && (key === 'j' || key === 'n')) // emacs and vim bindings
    ) {
      this.incrementSelectionIndex(1)
    } else if (key === 'ArrowUp' || (ctrlKey && (key === 'k' || key === 'p'))) {
      this.incrementSelectionIndex(-1)
    }
  }

  private handleSelect = (value: string): void => {
    const {onSelect} = this.props

    this.input.current.value = value
    this.input.current.blur()
    this.setState({areSuggestionsVisible: false})
    onSelect(value)
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
