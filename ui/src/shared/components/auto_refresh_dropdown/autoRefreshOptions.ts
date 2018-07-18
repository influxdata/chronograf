export interface AutoRefreshOption {
  milliseconds: number
  text: string
}

export const autoRefreshOptions: AutoRefreshOption[] = [
  {milliseconds: 0, text: 'Paused'},
  {
    milliseconds: 5000,
    text: 'Every 5s',
  },
  {
    milliseconds: 10000,
    text: 'Every 10s',
  },
  {
    milliseconds: 15000,
    text: 'Every 15s',
  },
  {
    milliseconds: 30000,
    text: 'Every 30s',
  },
  {
    milliseconds: 60000,
    text: 'Every 60s',
  },
]
