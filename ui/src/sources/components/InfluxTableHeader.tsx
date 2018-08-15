import React, {PureComponent, ReactElement} from 'react'

import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

import {Me, Source} from 'src/types'
import {ToggleWizard} from 'src/types/wizard'

interface Props {
  me: Me
  source: Source
  isUsingAuth: boolean
  toggleWizard: ToggleWizard
}

class InfluxTableHeader extends PureComponent<Props> {
  public render() {
    const {toggleWizard} = this.props
    return (
      <div className="panel-heading">
        <h2 className="panel-title">{this.title}</h2>
        <Authorized requiredRole={EDITOR_ROLE}>
          <div onClick={toggleWizard(true)} className="btn btn-sm btn-primary">
            <span className="icon plus" /> Add Connection
          </div>
        </Authorized>
      </div>
    )
  }

  private get title(): ReactElement<HTMLSpanElement> {
    const {isUsingAuth, me} = this.props
    if (isUsingAuth) {
      return (
        <span>
          Connections for <em>{me.currentOrganization.name}</em>
        </span>
      )
    }

    return <span>Connections</span>
  }
}

export default InfluxTableHeader
