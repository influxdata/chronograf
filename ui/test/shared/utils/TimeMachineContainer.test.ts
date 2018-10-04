import {
  TimeMachineContainer,
  TimeMachineState,
} from 'src/shared/utils/TimeMachineContainer'

import {LINEAR, NULL_STRING} from 'src/shared/constants/queryFillOptions'

import {defaultQueryDraft} from 'src/shared/utils/timeMachine'

import {QueryType} from 'src/types'

describe('TimeMachineContainer', () => {
  let initialState: Partial<TimeMachineState>
  let container: TimeMachineContainer

  beforeEach(() => {
    const queryDraft1 = defaultQueryDraft(QueryType.InfluxQL)
    const queryDraft2 = defaultQueryDraft(QueryType.InfluxQL)

    queryDraft1.id = '1'
    queryDraft1.queryConfig.id = '1'
    queryDraft2.id = '2'
    queryDraft2.queryConfig.id = '2'

    initialState = {queryDrafts: [queryDraft1, queryDraft2]}
    container = new TimeMachineContainer()
  })

  test('handleAddQuery', async () => {
    await container.reset(initialState)

    expect(container.state.queryDrafts).toHaveLength(2)

    await container.handleAddQuery()

    expect(container.state.queryDrafts).toHaveLength(3)
  })

  test('handleChooseNamespace', async () => {
    await container.reset(initialState)

    await container.handleChooseNamespace('1', {
      database: 'foo',
      retentionPolicy: 'bar',
    })

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.database).toBe('foo')
    expect(queryConfig.retentionPolicy).toBe('bar')
  })

  test('handleChooseMeasurement', async () => {
    await container.reset(initialState)

    await container.handleChooseMeasurement('1', 'foo')

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.measurement).toBe('foo')
  })

  test('handleToggleField', async () => {
    await container.reset(initialState)

    await container.handleToggleField('1', {value: 'a', type: 'field'})

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.fields).toEqual([{value: 'a', type: 'field'}])
  })

  test('handleApplyFuncsToField', async () => {
    const f1 = {value: 'f1', type: 'field'}
    const f2 = {value: 'f2', type: 'field'}

    initialState.queryDrafts[0].queryConfig.fields = [
      {
        value: 'fn1',
        type: 'func',
        args: [f1],
        alias: `fn1_${f1.value}`,
      },
      {
        value: 'fn1',
        type: 'func',
        args: [f2],
        alias: `fn1_${f2.value}`,
      },
      {
        value: 'fn2',
        type: 'func',
        args: [f1],
        alias: `fn2_${f1.value}`,
      },
    ]

    await container.reset(initialState)

    await container.handleApplyFuncsToField('1', {
      field: {
        value: 'f1',
        type: 'field',
      },
      funcs: [
        {
          value: 'fn3',
          type: 'func',
        },
        {
          value: 'fn4',
          type: 'func',
        },
      ],
    })

    expect(container.state.queryDrafts[0].queryConfig.fields).toEqual([
      {
        value: 'fn3',
        type: 'func',
        args: [f1],
        alias: `fn3_${f1.value}`,
      },
      {
        value: 'fn4',
        type: 'func',
        args: [f1],
        alias: `fn4_${f1.value}`,
      },
      {
        value: 'fn1',
        type: 'func',
        args: [f2],
        alias: `fn1_${f2.value}`,
      },
    ])
  })

  test('handleRemoveFuncs', async () => {
    const f1 = {value: 'f1', type: 'field'}
    const f2 = {value: 'f2', type: 'field'}
    const groupBy = {time: '1m', tags: []}

    const fields = [
      {
        value: 'fn1',
        type: 'func',
        args: [f1],
        alias: `fn1_${f1.value}`,
      },
      {
        value: 'fn1',
        type: 'func',
        args: [f2],
        alias: `fn1_${f2.value}`,
      },
    ]

    Object.assign(initialState.queryDrafts[0].queryConfig, {
      id: '123',
      database: 'db1',
      measurement: 'm1',
      fields,
      groupBy,
    })

    await container.reset(initialState)

    await container.handleRemoveFuncs('1', fields)

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.fields).toEqual([f1, f2])
    expect(queryConfig.groupBy.time).toBe(null)
  })

  describe('handleChooseTag', () => {
    test('can add a tag', async () => {
      initialState.queryDrafts[0].queryConfig.tags = {
        k1: ['v0'],
        k2: ['foo'],
      }

      await container.reset(initialState)

      await container.handleChooseTag('1', {
        key: 'k1',
        value: 'v1',
      })

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.tags).toEqual({
        k1: ['v0', 'v1'],
        k2: ['foo'],
      })
    })

    test("creates a new entry if it's the first key", async () => {
      await container.reset(initialState)

      await container.handleChooseTag('1', {
        key: 'k1',
        value: 'v1',
      })

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.tags).toEqual({
        k1: ['v1'],
      })
    })

    test('removes a value that is already in the list', async () => {
      initialState.queryDrafts[0].queryConfig.tags = {
        k1: ['v1'],
      }

      await container.reset(initialState)

      await container.handleChooseTag('1', {
        key: 'k1',
        value: 'v1',
      })

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.tags).toEqual({})
    })
  })

  describe('handleGroupByTag', () => {
    it('adds a tag key/value to the query', async () => {
      Object.assign(initialState.queryDrafts[0].queryConfig, {
        database: 'db1',
        measurement: 'm1',
        fields: [],
        tags: {},
        groupBy: {
          tags: [],
          time: null,
        },
      })

      await container.reset(initialState)

      await container.handleGroupByTag('1', 'k1')

      expect(container.state.queryDrafts[0].queryConfig.groupBy).toEqual({
        time: null,
        tags: ['k1'],
      })
    })

    it('removes a tag if the given tag key is already in the GROUP BY list', async () => {
      Object.assign(initialState.queryDrafts[0].queryConfig, {
        database: 'db1',
        measurement: 'm1',
        fields: [],
        tags: {},
        groupBy: {
          tags: ['k1'],
          time: null,
        },
      })

      await container.reset(initialState)

      await container.handleGroupByTag('1', 'k1')

      expect(container.state.queryDrafts[0].queryConfig.groupBy).toEqual({
        time: null,
        tags: [],
      })
    })
  })

  test('handleToggleTagAcceptance', async () => {
    await container.reset(initialState)

    await container.handleToggleTagAcceptance('1')

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.areTagsAccepted).toBe(false)
  })

  test('handleGroupByTime', async () => {
    await container.reset(initialState)

    await container.handleGroupByTime('1', '100y')

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.groupBy.time).toBe('100y')
  })

  test('handleEditQueryStatus', async () => {
    await container.reset(initialState)

    await container.handleEditQueryStatus('1', {success: 'yay'})

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.status).toEqual({success: 'yay'})
  })

  describe('handleFill', () => {
    it('applies an explicit fill when group by time is used', async () => {
      await container.reset(initialState)

      await container.handleGroupByTime('1', '10s')

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.fill).toBe(NULL_STRING)
    })

    it('updates fill to non-null-string non-number string value', async () => {
      await container.reset(initialState)

      await container.handleFill('1', LINEAR)

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.fill).toBe(LINEAR)
    })

    it('updates fill to string integer value', async () => {
      await container.reset(initialState)

      await container.handleFill('1', '1337')

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.fill).toBe('1337')
    })

    it('updates fill to string float value', async () => {
      await container.reset(initialState)

      await container.handleFill('1', '1.337')

      const queryConfig = container.state.queryDrafts[0].queryConfig

      expect(queryConfig.fill).toBe('1.337')
    })
  })

  test('handleTimeShift', async () => {
    await container.reset(initialState)

    const shift = {
      quantity: '1',
      unit: 'd',
      duration: '1d',
      label: 'label',
    }

    await container.handleTimeShift('1', shift)

    const queryConfig = container.state.queryDrafts[0].queryConfig

    expect(queryConfig.shifts).toEqual([shift])
  })
})
