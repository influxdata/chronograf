import React, {PureComponent, ReactElement} from 'react'
import {withRouter, WithRouterProps} from 'react-router'

import * as actions from 'src/shared/actions/sources'

import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import ConfirmButton from 'src/shared/components/ConfirmButton'
import KapacitorDropdown from 'src/sources/components/KapacitorDropdown'
import ConnectionLink from 'src/sources/components/ConnectionLink'
import Button from 'src/reusable_ui/components/Button'

import {ComponentColor, ComponentSize, ButtonShape} from 'src/reusable_ui/types'
import {Source, Kapacitor} from 'src/types'
import {ToggleWizard} from 'src/types/wizard'

interface Props {
  source: Source
  currentSource: Source
  onDeleteSource: (source: Source) => void
  setActiveKapacitor: (kapacitor: Kapacitor) => void
  deleteKapacitor: actions.DeleteKapacitor
  toggleWizard: ToggleWizard
}

class InfluxTableRow extends PureComponent<Props & WithRouterProps> {
  private connectionLink: React.RefObject<ConnectionLink> = React.createRef()

  public componentDidUpdate() {
    if (this.connectionLink.current) {
      this.connectionLink.current.forceUpdate()
    }
  }

  public render() {
    const {
      source,
      currentSource,
      setActiveKapacitor,
      deleteKapacitor,
      toggleWizard,
    } = this.props

    return (
      <tr className={this.className}>
        <td>{this.connectButton}</td>
        <td>
          <ConnectionLink
            ref={this.connectionLink}
            source={source}
            currentSource={currentSource}
            toggleWizard={toggleWizard}
          />
          <span>{source.url}</span>
        </td>
        <td className="text-right">
          <Authorized requiredRole={EDITOR_ROLE}>
            <ConfirmButton
              type="btn-danger"
              size="btn-xs"
              text="Delete Connection"
              confirmAction={this.handleDeleteSource}
              customClass="delete-source table--show-on-row-hover"
            />
          </Authorized>
        </td>
        <td className="source-table--kapacitor">
          <KapacitorDropdown
            source={source}
            kapacitors={source.kapacitors}
            deleteKapacitor={deleteKapacitor}
            setActiveKapacitor={setActiveKapacitor}
            toggleWizard={toggleWizard}
          />
        </td>
      </tr>
    )
  }

  private handleDeleteSource = (): void => {
    this.props.onDeleteSource(this.props.source)
  }

  private get connectButton(): ReactElement<HTMLDivElement> {
    if (this.isCurrentSource) {
      return (
        <Button
          text={'Connected'}
          color={ComponentColor.Success}
          size={ComponentSize.ExtraSmall}
          shape={ButtonShape.StretchToFit}
        />
      )
    }
    return (
      <Button
        text={'Connect'}
        onClick={this.routeToSource}
        color={ComponentColor.Default}
        size={ComponentSize.ExtraSmall}
        shape={ButtonShape.StretchToFit}
      />
    )
  }

  private routeToSource = () => {
    const {source, router} = this.props
    router.push(`/sources/${source.id}/manage-sources`)
  }

  private get className(): string {
    if (this.isCurrentSource) {
      return 'hightlight'
    }

    return ''
  }

  private get isCurrentSource(): boolean {
    const {source, currentSource} = this.props
    return source.id === currentSource.id
  }
}

export default withRouter(InfluxTableRow)
