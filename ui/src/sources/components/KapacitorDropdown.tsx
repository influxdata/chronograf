import React, {PureComponent, ReactElement} from 'react'
import {withRouter, WithRouterProps} from 'react-router'

import Dropdown from 'src/shared/components/Dropdown'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

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
  setActiveKapacitor: (k: KapacitorItem) => void
  deleteKapacitor: (Kapacitor: Kapacitor) => void
  toggleWizard?: ToggleVisibility
  buttonSize?: string
  suppressEdit?: boolean
}

export interface KapacitorItem {
  text: string
  resource: string
  kapacitor: Kapacitor
}

class KapacitorDropdown extends PureComponent<Props & WithRouterProps> {
  public static defaultProps: Partial<Props> = {
    buttonSize: 'btn-xs',
  }
  public render() {
    const {buttonSize, setActiveKapacitor} = this.props

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
          buttonSize={buttonSize}
          items={this.kapacitorItems}
          onChoose={setActiveKapacitor}
          addNew={{
            text: 'Add Kapacitor Connection',
            handler: this.launchWizard,
          }}
          actions={this.dropdownActions}
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

  private get dropdownActions() {
    const {deleteKapacitor, router, suppressEdit} = this.props

    const deleteAction = [
      {
        icon: 'trash',
        text: 'delete',
        handler: item => {
          deleteKapacitor(item.kapacitor)
        },
        confirmable: true,
      },
    ]

    const editAction = [
      {
        icon: 'pencil',
        text: 'edit',
        handler: item => {
          router.push(`${item.resource}/edit`)
        },
      },
    ]

    if (suppressEdit) {
      return deleteAction
    }

    return [...editAction, ...deleteAction]
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
    if (toggleWizard) {
      toggleWizard(true, source, 1)()
    }
  }
}

export default withRouter<Props>(KapacitorDropdown)
