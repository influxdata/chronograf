import {TimeShift} from 'src/types'

export const TIME_SHIFTS: TimeShift[] = [
  {label: 'none', quantity: null, unit: null},
  {label: '1m', quantity: '1', unit: 'm'},
  {label: '1h', quantity: '1', unit: 'h'},
  {label: '12h', quantity: '12', unit: 'h'},
  {label: '1d', quantity: '1', unit: 'd'},
  {label: '7d', quantity: '7', unit: 'd'},
  {label: '30d', quantity: '30', unit: 'd'},
  {label: '365d', quantity: '365', unit: 'd'},
]
