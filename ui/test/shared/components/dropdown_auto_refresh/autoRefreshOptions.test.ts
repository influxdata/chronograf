import {
  autoRefreshOptionPaused,
  AutoRefreshOptionType,
  getAutoRefreshOptions,
  setCustomAutoRefreshOptions,
} from 'src/shared/components/dropdown_auto_refresh/autoRefreshOptions'

describe('setCustomAutoRefreshOptions', () => {
  beforeEach(() => {
    // remove all custom refresh options
    setCustomAutoRefreshOptions('')
  })
  it('returns unchanged auto-refresh options withou customization', () => {
    const previousOpts = [...getAutoRefreshOptions()]
    setCustomAutoRefreshOptions(undefined)
    const newOpts = [...getAutoRefreshOptions()]

    expect(newOpts).toEqual(previousOpts)
  })
  it('returns sorted auto-refresh options with single customization', () => {
    setCustomAutoRefreshOptions('12s=12000')
    const newOpts = getAutoRefreshOptions()
    expect(newOpts).toEqual([
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
        id: 'custom-refresh-12s',
        milliseconds: 12000,
        label: '12s',
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
    ])
  })
  it('returns sorted auto-refresh options with more customizations', () => {
    setCustomAutoRefreshOptions('500ms=500;12s=12000;5m=300000')
    const newOpts = getAutoRefreshOptions()
    expect(newOpts).toEqual([
      {
        id: 'auto-refresh-header',
        milliseconds: 9999,
        label: 'Refresh',
        type: AutoRefreshOptionType.Header,
      },
      autoRefreshOptionPaused,
      {
        id: 'custom-refresh-500ms',
        milliseconds: 500,
        label: '500ms',
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
        id: 'custom-refresh-12s',
        milliseconds: 12000,
        label: '12s',
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
      {
        id: 'custom-refresh-5m',
        milliseconds: 300000,
        label: '5m',
        type: AutoRefreshOptionType.Option,
      },
    ])
  })
  it('ignores empty or invalid customization parts', () => {
    let warnings = 0
    const origConsoleWarn = console.warn
    console.warn = () => (warnings += 1)
    try {
      setCustomAutoRefreshOptions(' 12s=12000;; ;a=; b=10')
      const newOpts = getAutoRefreshOptions()
      expect(warnings).toBe(3) // ' ','a=','b=10'
      expect(newOpts).toEqual([
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
          id: 'custom-refresh-12s',
          milliseconds: 12000,
          label: '12s',
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
      ])
    } finally {
      console.warn(origConsoleWarn)
    }
  })
  it('removes all custom auto refresh intervals with empty spec', () => {
    // setting empty spec reset customizations
    const origSize = getAutoRefreshOptions().length
    setCustomAutoRefreshOptions('12s=12000;5m=300000')
    const opts1 = getAutoRefreshOptions()
    expect(opts1.length).toBe(origSize + 2)
    setCustomAutoRefreshOptions('')
    const opts2 = getAutoRefreshOptions()
    expect(opts2.length).toBe(origSize)
  })
})
