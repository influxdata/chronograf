import React, {Component, ReactElement, CSSProperties} from 'react'
import _ from 'lodash'

// Components
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import LayoutCellMenu from 'src/shared/components/LayoutCellMenu'
import LayoutCellHeader from 'src/shared/components/LayoutCellHeader'
import LayoutCellNote from 'src/shared/components/LayoutCellNote'
import {notify} from 'src/shared/actions/notifications'
import {notifyCSVDownloadFailed} from 'src/shared/copy/notifications'
import download from 'src/external/download.js'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {dataToCSV} from 'src/shared/parsing/dataToCSV'
import {timeSeriesToTableGraph} from 'src/utils/timeSeriesTransformers'
import {PREDEFINED_TEMP_VARS} from 'src/shared/constants'
import {
  DEFAULT_CELL_BG_COLOR,
  DEFAULT_CELL_TEXT_COLOR,
} from 'src/dashboards/constants'

// Types
import {Cell, CellQuery, Template} from 'src/types/'
import {NoteVisibility} from 'src/types/dashboards'
import {TimeSeriesServerResponse} from 'src/types/series'
import {CellType} from 'src/types/dashboards'
import {VisType} from 'src/types/flux'

interface Props {
  cell: Cell
  children: ReactElement<any>
  onDeleteCell: (cell: Cell) => void
  onCloneCell: (cell: Cell) => void
  onSummonOverlayTechnologies: (cell: Cell) => void
  isEditable: boolean
  cellData: TimeSeriesServerResponse[]
  templates: Template[]
  isFluxSource: boolean
  visType: VisType
  toggleVisType: () => void
}

@ErrorHandling
export default class LayoutCell extends Component<Props> {
  private cellBackgroundColor: string = DEFAULT_CELL_BG_COLOR
  private cellTextColor: string = DEFAULT_CELL_TEXT_COLOR

  public render() {
    const {
      cell,
      isEditable,
      cellData,
      onDeleteCell,
      onCloneCell,
      visType,
      toggleVisType,
      isFluxSource,
    } = this.props

    return (
      <>
        <div className="dash-graph" style={this.cellStyle}>
          <Authorized requiredRole={EDITOR_ROLE}>
            <LayoutCellMenu
              cell={cell}
              isEditable={isEditable}
              dataExists={!!cellData.length}
              onEdit={this.handleSummonOverlay}
              onClone={onCloneCell}
              onDelete={onDeleteCell}
              onCSVDownload={this.handleCSVDownload}
              queries={this.queries}
              isFluxSource={isFluxSource}
              visType={visType}
              toggleVisType={toggleVisType}
            />
          </Authorized>
          <LayoutCellNote
            visibility={cell.noteVisibility}
            cellType={cell.type}
            note={cell.note}
            cellX={cell.x}
            cellY={cell.y}
            cellBackgroundColor={this.cellBackgroundColor}
            cellTextColor={this.cellTextColor}
          />
          <LayoutCellHeader
            cellName={this.cellName}
            isEditable={isEditable}
            makeSpaceForCellNote={this.makeSpaceForCellNote}
            cellBackgroundColor={this.cellBackgroundColor}
            cellTextColor={this.cellTextColor}
          />
          <div className="dash-graph--container">{this.renderGraph}</div>
        </div>
        {this.gradientBorder}
      </>
    )
  }

  private get makeSpaceForCellNote(): boolean {
    const {cell} = this.props

    return (
      !!cell.note &&
      cell.type !== CellType.Note &&
      cell.noteVisibility === NoteVisibility.Default
    )
  }

  private get cellName(): string {
    const {
      cell: {name},
    } = this.props
    return this.replaceTemplateVariables(name)
  }

  private get userDefinedTemplateVariables(): Template[] {
    const {templates} = this.props
    return templates.filter(temp => {
      const isPredefinedTempVar: boolean = !!PREDEFINED_TEMP_VARS.find(
        t => t === temp.tempVar
      )
      return !isPredefinedTempVar
    })
  }

  private replaceTemplateVariables = (str: string): string => {
    const isTemplated: boolean = _.get(str.match(/:/g), 'length', 0) >= 2 // tempVars are wrapped in :

    if (isTemplated) {
      const renderedString = _.reduce<Template, string>(
        this.userDefinedTemplateVariables,
        (acc, template) => {
          const {tempVar} = template
          const templateValue = template.values.find(v => v.localSelected)
          const value = _.get(templateValue, 'value', tempVar)
          const regex = new RegExp(tempVar, 'g')
          return acc.replace(regex, value)
        },
        str
      )

      return renderedString
    }

    return str
  }

  private get queries(): CellQuery[] {
    const {cell} = this.props
    return _.get(cell, ['queries'], [])
  }

  private get renderGraph(): JSX.Element {
    const {cell, children} = this.props

    if (this.queries.length) {
      const child = React.Children.only(children)
      return React.cloneElement(child, {
        cellID: cell.i,
        onUpdateCellColors: this.onUpdateCellColors,
      })
    }

    return this.emptyGraph
  }

  private get emptyGraph(): JSX.Element {
    return (
      <div className="graph-empty">
        <Authorized requiredRole={EDITOR_ROLE}>
          <button
            className="no-query--button btn btn-md btn-primary"
            onClick={this.handleSummonOverlay}
          >
            <span className="icon plus" /> Add Data
          </button>
        </Authorized>
      </div>
    )
  }

  private handleSummonOverlay = (): void => {
    const {cell, onSummonOverlayTechnologies} = this.props
    onSummonOverlayTechnologies(cell)
  }

  private handleCSVDownload = async (): Promise<void> => {
    const {cellData, cell} = this.props
    const joinedName = cell.name.split(' ').join('_')
    const {data} = await timeSeriesToTableGraph(cellData)

    try {
      download(dataToCSV(data as any), `${joinedName}.csv`, 'text/plain')
    } catch (error) {
      notify(notifyCSVDownloadFailed())
      console.error(error)
    }
  }

  private get gradientBorder(): JSX.Element {
    return (
      <div className="dash-graph--gradient-border">
        <div className="dash-graph--gradient-top-left" />
        <div className="dash-graph--gradient-top-right" />
        <div className="dash-graph--gradient-bottom-left" />
        <div className="dash-graph--gradient-bottom-right" />
      </div>
    )
  }

  private onUpdateCellColors = (bgColor: string, textColor: string): void => {
    if (!bgColor) {
      this.cellBackgroundColor = DEFAULT_CELL_BG_COLOR
    } else {
      this.cellBackgroundColor = bgColor
    }
    this.cellTextColor = textColor
  }

  private get cellStyle(): CSSProperties {
    return {
      backgroundColor: this.cellBackgroundColor,
      borderColor: this.cellBackgroundColor,
    }
  }
}
