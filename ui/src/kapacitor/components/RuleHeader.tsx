import * as React from 'react'
import * as PropTypes from 'prop-types'
import RuleHeaderSave from 'kapacitor/components/RuleHeaderSave'

class RuleHeader extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {source, onSave, validationError} = this.props

    return (
      <div className="page-header">
        <div className="page-header__container">
          <div className="page-header__left">
            <h1 className="page-header__title">Alert Rule Builder</h1>
          </div>
          <RuleHeaderSave
            source={source}
            onSave={onSave}
            validationError={validationError}
          />
        </div>
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

RuleHeader.propTypes = {
  source: shape({}).isRequired,
  onSave: func.isRequired,
  validationError: string.isRequired,
}

export default RuleHeader
