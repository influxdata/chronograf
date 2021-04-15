export enum AutoRefreshOptionType {
  Option = 'option',
  Header = 'header',
}

export interface AutoRefreshOption {
  id: string
  milliseconds: number
  label: string
  type: AutoRefreshOptionType
}

export const autoRefreshOptionPaused: AutoRefreshOption = {
  id: 'auto-refresh-paused',
  milliseconds: 0,
  label: 'Paused',
  type: AutoRefreshOptionType.Option,
}

const autoRefreshOptions: AutoRefreshOption[] = [
  {
    id: 'auto-refresh-header',
    milliseconds: 9999,
    label: 'Refresh',
    type: AutoRefreshOptionType.Header,
  },
  autoRefreshOptionPaused,
  {
    id: 'auto-refresh-500ms',
    milliseconds: 500,
    label: '500ms',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-1s',
    milliseconds: 1000,
    label: '1s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-5s',
    milliseconds: 5000,
    label: '5s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-10s',
    milliseconds: 10000,
    label: '10s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-15s',
    milliseconds: 15000,
    label: '15s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-30s',
    milliseconds: 30000,
    label: '30s',
    type: AutoRefreshOptionType.Option,
  },
  {
    id: 'auto-refresh-60s',
    milliseconds: 60000,
    label: '60s',
    type: AutoRefreshOptionType.Option,
  },
]

export default autoRefreshOptions
