import React, {Component, PropTypes} from 'react'

class NameSection extends Component {
  constructor(props) {
    super(props)

    this.state = {
      reset: false,
    }
  }

  handleInputBlur = reset => e => {
    const {defaultName, onRuleRename, ruleID} = this.props

    onRuleRename(ruleID, reset ? defaultName : e.target.value)
    this.setState({reset: false})
  }

  handleKeyDown = e => {
    if (e.key === 'Enter') {
      this.inputRef.blur()
    }
    if (e.key === 'Escape') {
      this.inputRef.value = this.props.defaultName
      this.setState({reset: true}, () => this.inputRef.blur())
    }
  }

  render() {
    const {ruleID, defaultName} = this.props
    const {reset} = this.state

    return (
      <div className="rule-section">
        <h3 className="rule-section--heading">
          {ruleID === 'new' ? 'Name this Alert Rule' : 'Name'}
        </h3>
        <div className="rule-section--body">
          <div className="rule-section--row rule-section--row-first rule-section--row-last">
            <input
              type="text"
              className="form-control input-md form-malachite"
              defaultValue={defaultName}
              onBlur={this.handleInputBlur(reset)}
              onKeyDown={this.handleKeyDown}
              placeholder="ex: Ruley McRuleface"
              ref={r => (this.inputRef = r)}
            />
          </div>
        </div>
      </div>
    )
  }
}

const {func, string} = PropTypes

NameSection.propTypes = {
  defaultName: string.isRequired,
  onRuleRename: func.isRequired,
  ruleID: string.isRequired,
}

export default NameSection
