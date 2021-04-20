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

let autoRefreshOptions: AutoRefreshOption[] = [
  {
    id: 'auto-refresh-header',
    milliseconds: 9999,
    label: 'Refresh',
    type: AutoRefreshOptionType.Header,
  },
  autoRefreshOptionPaused,
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

/** setCustomAutoRefreshOptions allows to set custom auto-refresh options */
export function setCustomAutoRefreshOptions(customSpec: string | undefined) {
  if (!customSpec) {
    return
  }
  // 1st filter all custom options
  autoRefreshOptions = autoRefreshOptions.filter(x => x.id.startsWith('custom'))
  const [header, paused, ...other] = autoRefreshOptions
  const customOptions: AutoRefreshOption[] = customSpec
    .split(',')
    .reduce((acc, singleSpec) => {
      try {
        const [a, b] = singleSpec.split['=']
        const label = a.trim()
        const milliseconds = parseInt(b, 10)
        acc.push({
          id: `custom-refresh-${label}`,
          milliseconds,
          label,
          type: AutoRefreshOptionType.Option,
        })
      } catch (e) {
        console.warn(
          'Unable to parse custom autoRefreshOption, it should have format `label=milliseconds`',
          e
        )
      }
      return acc
    }, [] as AutoRefreshOption[])
  return [
    header,
    paused,
    [...other, ...customOptions].sort(
      (a, b) => a.milliseconds - b.milliseconds
    ),
  ]
}

export function getAutoRefreshOptions(): AutoRefreshOption[] {
  return autoRefreshOptions
}
