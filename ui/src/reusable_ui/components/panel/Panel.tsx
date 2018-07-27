// Libraries
import React, {Component, Children} from 'react'
import classnames from 'classnames'

// Components
import PanelHeader from 'src/reusable_ui/components/panel/PanelHeader'
import PanelBody from 'src/reusable_ui/components/panel/PanelBody'
import PanelFooter from 'src/reusable_ui/components/panel/PanelFooter'

// Styles
import 'src/reusable_ui/components/panel/Panel.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

export enum PanelType {
  Default = '',
  Solid = 'solid',
}

interface Props {
  children: JSX.Element[]
  type?: PanelType
}

@ErrorHandling
class Panel extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    type: PanelType.Default,
  }

  public static Header = PanelHeader
  public static Body = PanelBody
  public static Footer = PanelFooter

  public render() {
    const {children} = this.props

    this.validateChildren()

    return <div className={this.className}>{children}</div>
  }

  private get className(): string {
    const {type} = this.props

    return classnames('panel', {'panel-solid': type === PanelType.Solid})
  }

  private validateChildren = (): void => {
    const {children} = this.props

    let invalidCount = 0

    Children.forEach(children, (child: JSX.Element) => {
      if (
        child.type === PanelHeader ||
        child.type === PanelBody ||
        child.type === PanelFooter
      ) {
        return
      }

      invalidCount += 1
      return
    })

    if (invalidCount > 0) {
      throw new Error(
        'Panel expected children of type <Panel.Header>, <Panel.Body>, or <Panel.Footer>'
      )
    }
  }
}

export default Panel
