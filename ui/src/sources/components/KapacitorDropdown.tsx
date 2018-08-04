import React, {PureComponent, ReactElement} from 'react'
import {withRouter, WithRouterProps} from 'react-router'

import Dropdown from 'src/shared/components/Dropdown'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

import {SetActiveKapacitor} from 'src/shared/actions/sources'
import Button from 'src/reusable_ui/components/Button'
import {ToggleVisibility} from 'src/types/wizard'

import {
  ComponentColor,
  ComponentSize,
  ButtonShape,
  IconFont,
} from 'src/reusable_ui/types'
import {Source, Kapacitor} from 'src/types'

interface Props {
  source: Source
  kapacitors: Kapacitor[]
  setActiveKapacitor: SetActiveKapacitor
  deleteKapacitor: (Kapacitor: Kapacitor) => void
  toggleWizard: ToggleVisibility
}

interface KapacitorItem {
  text: string
  resource: string
  kapacitor: Kapacitor
}

class KapacitorDropdown extends PureComponent<Props & WithRouterProps> {
  public render() {
    const {setActiveKapacitor, deleteKapacitor, router} = this.props

    if (this.isKapacitorsEmpty) {
      return (
        <Authorized requiredRole={EDITOR_ROLE}>
          <Button
            text={'Add Kapacitor Connection'}
            onClick={this.launchWizard}
            color={ComponentColor.Default}
            size={ComponentSize.ExtraSmall}
            shape={ButtonShape.StretchToFit}
            icon={IconFont.Plus}
          />
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
          items={this.kapacitorItems}
          onChoose={setActiveKapacitor}
          addNew={{
            text: 'Add Kapacitor Connection',
            handler: this.launchWizard,
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
                deleteKapacitor(item.kapacitor)
              },
              confirmable: true,
            },
          ]}
          selected={this.selected}
        />
      </Authorized>
    )
  }

  private get UnauthorizedDropdown(): ReactElement<HTMLDivElement> {
    return (
      <div className="source-table--kapacitor__view-only">{this.selected}</div>
    )
  }

  private get isKapacitorsEmpty(): boolean {
    const {kapacitors} = this.props
    return !kapacitors || kapacitors.length === 0
  }

  private get kapacitorItems(): KapacitorItem[] {
    const {kapacitors, source} = this.props

    return kapacitors.map(k => {
      return {
        text: k.name,
        resource: `/sources/${source.id}/kapacitors/${k.id}`,
        kapacitor: k,
      }
    })
  }

  private get activeKapacitor(): Kapacitor {
    return this.props.kapacitors.find(k => k.active)
  }

  private get selected(): string {
    let selected = ''
    if (this.activeKapacitor) {
      selected = this.activeKapacitor.name
    } else {
      selected = this.kapacitorItems[0].text
    }

    return selected
  }

  private launchWizard = () => {
    const {toggleWizard, source} = this.props
    toggleWizard(true, source, 1)()
  }
}

export default withRouter<Props>(KapacitorDropdown)
