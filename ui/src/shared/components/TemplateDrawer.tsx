import * as React from 'react'
import * as PropTypes from 'prop-types'
import onClickOutside from 'react-onClickOutside'
import classnames from 'classnames'

const TemplateDrawer = ({
  templates,
  selected,
  onMouseOverTempVar,
  onClickTempVar,
}) =>
  <div className="template-drawer">
    {templates.map(t =>
      <div
        className={classnames('template-drawer--item', {
          'template-drawer--selected': t.tempVar === selected.tempVar,
        })}
        onMouseOver={onMouseOverTempVar(t)}
        onClick={onClickTempVar(t)}
        key={t.tempVar}
      >
        {' '}{t.tempVar}{' '}
      </div>
    )}
  </div>

const {arrayOf, func, shape, string} = PropTypes

TemplateDrawer.propTypes = {
  templates: arrayOf(
    shape({
      tempVar: string.isRequired,
    })
  ),
  selected: shape({
    tempVar: string,
  }),
  onMouseOverTempVar: func.isRequired,
  onClickTempVar: func.isRequired,
}

export default onClickOutside(TemplateDrawer)
