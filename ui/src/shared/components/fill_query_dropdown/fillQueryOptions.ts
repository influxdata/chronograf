export const LINEAR = 'linear'
export const NONE = 'none'
export const NULL_STRING = 'null'
export const NUMBER = 'number'
export const PREVIOUS = 'previous'

export interface FillQueryOption {
  type: string
  label: string
  inputValue: string
  isValidForKapaNodes: boolean
}

export const fillQueryOptions: FillQueryOption[] = [
  {
    type: NULL_STRING,
    label: '(null)',
    inputValue: 'null',
    isValidForKapaNodes: true,
  },
  {
    type: PREVIOUS,
    label: '(previous)',
    inputValue: 'previous',
    isValidForKapaNodes: false,
  },
  {
    type: NUMBER,
    label: '(number)',
    inputValue: '0',
    isValidForKapaNodes: true,
  },
  {
    type: NONE,
    label: '(none)',
    inputValue: 'none',
    isValidForKapaNodes: true,
  },
  {
    type: LINEAR,
    label: '(linear)',
    inputValue: 'linear',
    isValidForKapaNodes: false,
  },
]
