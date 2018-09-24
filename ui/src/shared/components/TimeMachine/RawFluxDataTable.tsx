import React, {PureComponent} from 'react'
import {AutoSizer, Grid} from 'react-virtualized'

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

  public state = {data: [], maxColumnCount: 0}

  public render() {
    const {width, height} = this.props
    const {data, maxColumnCount} = this.state

    return (
      <div className="raw-flux-data-table">
        <AutoSizer>
          {({width: autoWidth, height: autoHeight}) => (
            <Grid
              width={width ? width : autoWidth}
              height={height ? height : autoHeight}
              cellRenderer={this.renderCell}
              columnCount={maxColumnCount}
              rowCount={data.length}
              rowHeight={ROW_HEIGHT}
              columnWidth={Math.max(MIN_COLUMN_WIDTH, width / maxColumnCount)}
            />
          )}
        </AutoSizer>
      </div>
    )
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
