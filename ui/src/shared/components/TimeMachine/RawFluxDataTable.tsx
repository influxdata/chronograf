import React, {PureComponent} from 'react'
import {AutoSizer, Grid} from 'react-virtualized'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'

import {parseResponseRaw} from 'src/shared/parsing/flux/response'

interface Props {
  csv: string

  // Used to give component explicit dimensions in testing. The component is
  // sized automatically otherwise
  width?: number
  height?: number
}

interface State {
  data: string[][]
  maxColumnCount: number
  scrollLeft: number
  scrollTop: number
}

const ROW_HEIGHT = 30
const MIN_COLUMN_WIDTH = 100

class RawFluxDataTable extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(props): Partial<State> {
    // We are using `getDerivedStateFromProps` since this component only
    // accepts one prop, and we want to recompute the state every time that prop
    // changes. We can't use `memoizeOne`, since the prop is a large string and
    // the equality check used in the `memoizeOne` helper is itself potentially
    // quite expensive.
    const {data, maxColumnCount} = parseResponseRaw(props.csv)

    return {data, maxColumnCount}
  }

  public state = {data: [], maxColumnCount: 0, scrollLeft: 0, scrollTop: 0}

  public render() {
    const {width, height} = this.props
    const {data, maxColumnCount, scrollTop, scrollLeft} = this.state

    return (
      <div className="raw-flux-data-table">
        <AutoSizer>
          {({width: autoWidth, height: autoHeight}) => {
            const resolvedWidth = width ? width : autoWidth
            const resolvedHeight = height ? height : autoHeight
            const columnWidth = Math.max(
              MIN_COLUMN_WIDTH,
              resolvedWidth / maxColumnCount
            )
            const gridScrollWidth = columnWidth * maxColumnCount
            const gridScrollHeight = ROW_HEIGHT * data.length

            return (
              <FancyScrollbar
                style={{
                  overflowY: 'hidden',
                  width: resolvedWidth,
                  height: resolvedHeight,
                }}
                autoHide={false}
                scrollTop={scrollTop}
                scrollLeft={scrollLeft}
                setScrollTop={this.onScrollbarsScroll}
              >
                <Grid
                  width={resolvedWidth}
                  height={resolvedHeight}
                  cellRenderer={this.renderCell}
                  columnCount={maxColumnCount}
                  rowCount={data.length}
                  rowHeight={ROW_HEIGHT}
                  columnWidth={columnWidth}
                  scrollLeft={scrollLeft}
                  scrollTop={scrollTop}
                  style={{
                    width: gridScrollWidth,
                    height: gridScrollHeight,
                  }}
                />
              </FancyScrollbar>
            )
          }}
        </AutoSizer>
      </div>
    )
  }

  private onScrollbarsScroll = e => {
    e.preventDefault()
    e.stopPropagation()

    const {scrollTop, scrollLeft} = e.target as HTMLElement

    this.setState({scrollLeft, scrollTop})
  }

  private renderCell = ({columnIndex, key, rowIndex, style}) => {
    const datum = this.state.data[rowIndex][columnIndex]

    return (
      <div
        key={key}
        style={style}
        className="raw-flux-data-table--cell"
        title={datum}
      >
        <div className="raw-flux-data-table--cell-bg">{datum}</div>
      </div>
    )
  }
}

export default RawFluxDataTable
