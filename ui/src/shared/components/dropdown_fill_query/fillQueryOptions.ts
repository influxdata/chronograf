export enum FillQueryTypes {
  Linear = 'linear',
  None = 'none',
  NullString = 'null',
  Number = 'number',
  Previous = 'previous',
}

export interface FillQueryOption {
  type: string
  label: string
  inputValue: string
  isValidForKapaNodes: boolean
}

export const fillQueryOptions: FillQueryOption[] = [
  {
    type: FillQueryTypes.NullString,
    label: '(null)',
    inputValue: 'null',
    isValidForKapaNodes: true,
  },
  {
    type: FillQueryTypes.Previous,
    label: '(previous)',
    inputValue: 'previous',
    isValidForKapaNodes: false,
  },
  {
    type: FillQueryTypes.Number,
    label: '(number)',
    inputValue: '0',
    isValidForKapaNodes: true,
  },
  {
    type: FillQueryTypes.None,
    label: '(none)',
    inputValue: 'none',
    isValidForKapaNodes: true,
  },
  {
    type: FillQueryTypes.Linear,
    label: '(linear)',
    inputValue: 'linear',
    isValidForKapaNodes: false,
  },
]
