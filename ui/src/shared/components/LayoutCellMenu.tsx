import React, {Component} from 'react'

import classnames from 'classnames'

import MenuTooltipButton, {
  MenuItem,
} from 'src/shared/components/MenuTooltipButton'
import CustomTimeIndicator from 'src/shared/components/CustomTimeIndicator'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {Cell} from 'src/types/dashboards'
import {QueryConfig} from 'src/types/queries'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {VisType} from 'src/types/flux'

interface Query {
  text?: string
  queryConfig: QueryConfig
}

interface Props {
  cell: Cell
  isEditable: boolean
  dataExists: boolean
  onEdit: () => void
  onClone: (cell: Cell) => void
  onDelete: (cell: Cell) => void
  onCSVDownload: () => void
  queries: Query[]
  isFluxQuery: boolean
  visType: VisType
  toggleVisType: () => void
}

interface State {
  subMenuIsOpen: boolean
}

@ErrorHandling
class LayoutCellMenu extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      subMenuIsOpen: false,
    }
  }

  public render() {
    const {queries} = this.props

    return (
      <div className={this.contextMenuClassname}>
        <div className={this.customIndicatorsClassname}>
          {queries && <CustomTimeIndicator queries={queries} />}
        </div>
        {this.renderMenu}
      </div>
    )
  }

  private get renderMenu(): JSX.Element {
    const {isEditable} = this.props

    if (!isEditable) {
      return
    }

    return (
      <div className="dash-graph-context--buttons">
        {this.pencilMenu}
        <Authorized requiredRole={EDITOR_ROLE}>
          <MenuTooltipButton
            icon="duplicate"
            menuItems={this.cloneMenuItems}
            informParent={this.handleToggleSubMenu}
          />
        </Authorized>
        <MenuTooltipButton
          icon="trash"
          theme="danger"
          menuItems={this.deleteMenuItems}
          informParent={this.handleToggleSubMenu}
        />
      </div>
    )
  }

  private get pencilMenu(): JSX.Element {
    const {queries} = this.props

    if (!queries.length) {
      return
    }

    return (
      <MenuTooltipButton
        icon="pencil"
        menuItems={this.editMenuItems}
        informParent={this.handleToggleSubMenu}
      />
    )
  }

  private get contextMenuClassname(): string {
    const {subMenuIsOpen} = this.state

    return classnames('dash-graph-context', {
      'dash-graph-context__open': subMenuIsOpen,
    })
  }
  private get customIndicatorsClassname(): string {
    const {isEditable} = this.props

    return classnames('dash-graph--custom-indicators', {
      'dash-graph--draggable': isEditable,
    })
  }

  private get editMenuItems(): MenuItem[] {
    const {
      dataExists,
      onCSVDownload,
      toggleVisType,
      visType,
      isFluxQuery,
    } = this.props

    const visTypeItem = {
      text: 'View Raw Data',
      action: toggleVisType,
      disabled: false,
    }

    if (visType === VisType.Table) {
      visTypeItem.text = 'View Visualization'
    }

    const menuItems = [
      {
        text: 'Configure',
        action: this.handleEditCell,
        disabled: false,
      },
      {
        text: 'Download CSV',
        action: onCSVDownload,
        disabled: !dataExists,
      },
    ]

    if (isFluxQuery) {
      menuItems.push(visTypeItem)
    }

    return menuItems
  }

  private get cloneMenuItems(): MenuItem[] {
    return [{text: 'Clone Cell', action: this.handleCloneCell, disabled: false}]
  }

  private get deleteMenuItems(): MenuItem[] {
    return [{text: 'Confirm', action: this.handleDeleteCell, disabled: false}]
  }

  private handleEditCell = (): void => {
    const {onEdit} = this.props
    onEdit()
  }

  private handleDeleteCell = (): void => {
    const {onDelete, cell} = this.props
    onDelete(cell)
  }

  private handleCloneCell = (): void => {
    const {onClone, cell} = this.props
    onClone(cell)
  }

  private handleToggleSubMenu = (): void => {
    this.setState({subMenuIsOpen: !this.state.subMenuIsOpen})
  }
}

export default LayoutCellMenu
