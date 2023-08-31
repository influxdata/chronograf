import React, {Component, MouseEvent} from 'react'
import OnClickOutside from 'react-onclickoutside'
import classnames from 'classnames'

import {Template} from 'src/types'

interface TempVar {
  tempVar: string
}

interface Props {
  templates: Template[]
  selected: TempVar
  onMouseOverTempVar: (
    template: Template
  ) => (e: MouseEvent<HTMLDivElement>) => void
  onClickTempVar: (
    template: Template
  ) => (e: MouseEvent<HTMLDivElement>) => void
}

// TemplateDrawer must be a class component,
// functional components are not supported by react-onclickoutside
class TemplateDrawer extends Component<Props> {
  constructor(props: Props | Readonly<Props>) {
    super(props)
  }

  public render(): React.ReactNode {
    const {templates, selected, onMouseOverTempVar, onClickTempVar} = this.props

    return (
      <div className="template-drawer">
        {templates.map(t => (
          <div
            className={classnames('template-drawer--item', {
              'template-drawer--selected': t.tempVar === selected.tempVar,
            })}
            onMouseOver={onMouseOverTempVar(t)}
            onMouseDown={onClickTempVar(t)}
            key={t.tempVar}
          >
            {' '}
            {t.tempVar}{' '}
          </div>
        ))}
      </div>
    )
  }
}

export default OnClickOutside(TemplateDrawer)
