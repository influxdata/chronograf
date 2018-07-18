import React, {PureComponent, ReactElement} from 'react'
import {Link, withRouter, RouteComponentProps} from 'react-router'

import Dropdown from 'src/shared/components/Dropdown'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {Source, Service} from 'src/types'

interface Props {
  source: Source
  services: Service[]
}

interface FluxServiceItem {
  text: string
  resource: string
  service: Service
}

class FluxDropdown extends PureComponent<
  Props & RouteComponentProps<any, any>
> {
  public render() {
    const {source, router} = this.props

    if (this.isServicesEmpty) {
      return (
        <Authorized requiredRole={EDITOR_ROLE}>
          <Link
            to={`/sources/${source.id}/services/new`}
            className="btn btn-xs btn-default"
          >
            <span className="icon plus" /> Add Flux Connection
          </Link>
        </Authorized>
      )
    }

    return (
      <Authorized
        requiredRole={EDITOR_ROLE}
        replaceWithIfNotAuthorized={this.UnauthorizedDropdown}
      >
        <Dropdown
          className="dropdown-260"
          buttonColor="btn-primary"
          buttonSize="btn-xs"
          items={this.fluxItems}
          onChoose={this.handleChoose}
          addNew={{
            url: `/sources/${source.id}/flux/new`,
            text: 'Add Flux Connection',
          }}
          actions={[
            {
              icon: 'pencil',
              text: 'edit',
              handler: item => {
                router.push(`${item.resource}/edit`)
              },
            },
            // {
            //   icon: 'trash',
            //   text: 'delete',
            //   handler: item => {
            //     deleteKapacitor(item.kapacitor)
            //   },
            //   confirmable: true,
            // },
          ]}
          selected={this.selected}
        />
      </Authorized>
    )
  }

  private handleChoose = (selected: FluxServiceItem) => {
    selected = selected
  }

  private get UnauthorizedDropdown(): ReactElement<HTMLDivElement> {
    return (
      <div className="source-table--kapacitor__view-only">{this.selected}</div>
    )
  }

  private get isServicesEmpty(): boolean {
    const {services} = this.props
    return !services || services.length === 0
  }

  private get fluxItems(): FluxServiceItem[] {
    const {services, source} = this.props

    return services.map(s => {
      return {
        text: s.name,
        resource: `/sources/${source.id}/flux/${s.id}`,
        service: s,
      }
    })
  }

  private get selected(): string {
    const {services} = this.props
    return services[0].name
  }
}

export default withRouter<Props>(FluxDropdown)
