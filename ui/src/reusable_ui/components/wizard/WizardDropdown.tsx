import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface DropdownOption {
  value: string
  label: string
}

interface Props {
  value?: string
  options: DropdownOption[]
  placeholder?: string
  label: string
  subtext?: string
  onChange: (value: string) => void
  halfWidth?: boolean
  testId?: string
}

interface State {
  isOpen: boolean
  menuStyle?: React.CSSProperties
}

class WizardDropdown extends PureComponent<Props, State> {
  private readonly dropdownRef: React.RefObject<HTMLDivElement>

  constructor(props: Props) {
    super(props)
    this.state = {
      isOpen: false,
      menuStyle: undefined,
    }
    this.dropdownRef = React.createRef()
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside)
    document.addEventListener('scroll', this.handleScroll, true)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('scroll', this.handleScroll, true)
  }

  public render() {
    const {label, subtext, halfWidth, testId} = this.props
    const {isOpen} = this.state

    return (
      <div className={'form-group ' + (halfWidth ? 'col-xs-6' : 'col-xs-12')}>
        <label htmlFor={`wizard-dropdown-${testId}`}>{label}</label>
        <div className="wizard-dropdown" ref={this.dropdownRef}>
          <button
            id={`wizard-dropdown-${testId}`}
            className={`wizard-dropdown--button ${isOpen ? 'active' : ''} ${
              this.selectedOption ? '' : 'placeholder'
            }`}
            onClick={this.toggleDropdown}
            type="button"
            data-testid={testId}
          >
            <span>{this.buttonText}</span>
            <div className="wizard-dropdown--arrow" />
          </button>
          <div
            className={`wizard-dropdown--menu ${isOpen ? 'active' : ''}`}
            style={this.state.menuStyle}
          >
            {this.props.options.map(option => (
              <div
                key={option.value}
                className={`wizard-dropdown--option ${
                  this.props.value === option.value ? 'selected' : ''
                }`}
                onClick={() => this.selectOption(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
        {subtext && <span className="wizard-dropdown--subtext">{subtext}</span>}
      </div>
    )
  }

  private get buttonText(): string {
    const {placeholder = 'Select option...'} = this.props
    return this.selectedOption ? this.selectedOption.label : placeholder
  }

  private get selectedOption(): DropdownOption | undefined {
    return this.props.options.find(opt => opt.value === this.props.value)
  }

  private toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!this.state.isOpen && this.dropdownRef.current) {
      // Calculate position for fixed positioning to avoid overflow issues
      const rect = this.dropdownRef.current.getBoundingClientRect()
      const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: `${rect.bottom + 4}px`, // Include the 4px margin
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 10000,
      }
      // Set position first, then make visible in next tick
      this.setState({menuStyle}, () => {
        requestAnimationFrame(() => {
          this.setState({isOpen: true})
        })
      })
    } else {
      this.setState({isOpen: false, menuStyle: undefined})
    }
  }

  private selectOption = (value: string) => {
    this.props.onChange(value)
    this.setState({isOpen: false, menuStyle: undefined})
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (
      this.dropdownRef.current &&
      !this.dropdownRef.current.contains(event.target as Node)
    ) {
      this.setState({isOpen: false, menuStyle: undefined})
    }
  }

  private handleScroll = () => {
    // Close dropdown when scrolling to prevent position mismatch
    if (this.state.isOpen) {
      this.setState({isOpen: false, menuStyle: undefined})
    }
  }
}

export default ErrorHandling(WizardDropdown)
