import React, {PureComponent, ReactElement} from 'react'
import {Link, withRouter, RouteComponentProps} from 'react-router'

import Dropdown from 'src/shared/components/Dropdown'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

import {getDeep} from 'src/utils/wrappers'

import {Source, Service} from 'src/types'

interface Props {
  source: Source
  services: Service[]
  setActiveFlux: (source: Source, fluxService: Service) => void
  deleteFlux: (fluxService: Service) => void
}

interface FluxServiceItem {
  text: string
  resource: string
  service: Service
}

type FluxDropdownProps = Props & RouteComponentProps<any, any>

export class FluxDropdown extends PureComponent<FluxDropdownProps> {
  public render() {
    const {source, router, deleteFlux} = this.props

    if (this.isServicesEmpty) {
      return (
        <Authorized requiredRole={EDITOR_ROLE}>
          <Link
            to={`/sources/${source.id}/flux/new`}
            className="btn btn-xs btn-default"
            data-test="link"
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
          data-test="dropdown"
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
            {
              icon: 'trash',
              text: 'delete',
              handler: item => {
                deleteFlux(item.service)
              },
              confirmable: true,
            },
          ]}
          selected={this.selected}
        />
      </Authorized>
    )
  }

  private handleChoose = (selected: FluxServiceItem) => {
    const {source, setActiveFlux} = this.props
    setActiveFlux(source, selected.service)
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
    const service = services.find(s => {
      return getDeep<boolean>(s, 'metadata.active', false)
    })
    if (service) {
      return service.name
    }
    return services[0].name
  }
}

export default withRouter<Props>(FluxDropdown)
