import {DEFAULT_TABLE_OPTIONS} from 'src/dashboards/constants'
import {stringifyColorValues} from 'src/shared/constants/colorOperations'
import {CellType, Axis, Axes, Legend} from 'src/types/dashboards'
import {ColorString, ColorNumber} from 'src/types/colors'

export const initializeOptions = (cellType: CellType) => {
  switch (cellType) {
    case 'table':
      return DEFAULT_TABLE_OPTIONS
    default:
      return DEFAULT_TABLE_OPTIONS
  }
}

export const AXES_SCALE_OPTIONS = {
  LINEAR: 'linear',
  LOG: 'log',
  BASE_2: '2',
  BASE_10: '10',
  BASE_RAW: 'raw',
}

type DefaultAxis = Pick<
  Axis,
  Exclude<keyof Axis, ['bounds', 'tradingHours1', 'tradingHours2']>
>

export const DEFAULT_AXIS: DefaultAxis = {
  prefix: '',
  suffix: '',
  base: AXES_SCALE_OPTIONS.BASE_10,
  scale: AXES_SCALE_OPTIONS.LINEAR,
  label: '',
}

export const FULL_DEFAULT_AXIS: Axis = {
  ...DEFAULT_AXIS,
  bounds: ['', ''],
  // sup test
  tradingHours1: ['', ''],
  tradingHours2: ['', ''],
}

export const DEFAULT_AXES: Axes = {
  x: FULL_DEFAULT_AXIS,
  y: FULL_DEFAULT_AXIS,
}

interface Color {
  cellType: CellType
  thresholdsListColors: ColorNumber[]
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
}

export const getCellTypeColors = ({
  cellType,
  gaugeColors,
  thresholdsListColors,
  lineColors,
}: Color): ColorString[] => {
  switch (cellType) {
    case CellType.Gauge: {
      return stringifyColorValues(gaugeColors)
    }
    case CellType.SingleStat:
    case CellType.Table: {
      return stringifyColorValues(thresholdsListColors)
    }
    case CellType.Bar:
    case CellType.Line:
    case CellType.LinePlusSingleStat:
    case CellType.Stacked:
    case CellType.StepPlot: {
      return stringifyColorValues(lineColors)
    }
    default: {
      return []
    }
  }
}

export const STATIC_LEGEND: Legend = {
  type: 'static',
  orientation: 'bottom',
}
