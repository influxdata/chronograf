import React, {ChangeEvent, useEffect, useMemo, useState} from 'react'
import BuilderCard from './BuilderCard'
import DefaultDebouncer from 'src/shared/utils/debouncer'
import {RemoteDataState, BuilderAggregateFunctionType} from 'src/types'
import Dropdown from '../../Dropdown'
import WaitingText from '../../WaitingText'

const SEARCH_DEBOUNCE_MS = 400

function renderType(type: BuilderAggregateFunctionType) {
  if (type === 'group') {
    return 'Group'
  }
  return 'Filter'
}

interface Props {
  index: number
  aggregateFunctionType: BuilderAggregateFunctionType
  onRemoveTagSelector: (index: number) => void
  onChangeFunctionType: (
    type: BuilderAggregateFunctionType,
    index: number
  ) => void

  keysStatus: RemoteDataState
  keys: string[]
  selectedKey: string
  onKeyChange: (key: string, index: number) => void

  valuesSearchTerm: string
  onChangeValuesSearchTerm: (searchTerm: string, index: number) => void
  onSearchValues: (index: number) => void

  valuesStatus: RemoteDataState
  values: string[]
  selectedValues: string[]
  onChangeSelectedValues: (values: string[], index: number) => void
}

const TagSelector = (props: Props) => {
  const {
    index,
    aggregateFunctionType,
    onRemoveTagSelector,
    onChangeFunctionType,
  } = props

  return (
    <BuilderCard>
      <BuilderCard.DropdownHeader
        options={['Filter', 'Group']}
        selectedOption={renderType(aggregateFunctionType)}
        onDelete={index ? () => onRemoveTagSelector(index) : undefined}
        onSelect={val =>
          onChangeFunctionType(val === 'Filter' ? 'filter' : 'group', index)
        }
      />
      <TagSelectorBody {...props} />
    </BuilderCard>
  )
}

const TagSelectorBody = (props: Props) => {
  const {
    aggregateFunctionType,
    index,
    keys,
    keysStatus,
    selectedKey,
    onKeyChange,
    valuesSearchTerm,
    onChangeValuesSearchTerm,
    onSearchValues,
    selectedValues,
  } = props

  if (keysStatus === RemoteDataState.NotStarted) {
    return (
      <BuilderCard.Empty>
        <WaitingText text="Waiting for tag keys" />
      </BuilderCard.Empty>
    )
  }

  if (keysStatus === RemoteDataState.Loading) {
    return (
      <BuilderCard.Empty>
        <WaitingText text="Loading tag keys" />
      </BuilderCard.Empty>
    )
  }

  if (keysStatus === RemoteDataState.Error) {
    return <BuilderCard.Empty>Failed to load tag keys</BuilderCard.Empty>
  }

  if (keysStatus === RemoteDataState.Done && !keys.length) {
    return (
      <BuilderCard.Empty testID="empty-tag-keys">
        No tag keys found <small>in the current time range</small>
      </BuilderCard.Empty>
    )
  }

  const debouncer = useMemo(() => new DefaultDebouncer(), [])
  useEffect(() => () => debouncer.cancelAll(), [])
  function onValueTermChange(e: ChangeEvent<HTMLInputElement>) {
    onChangeValuesSearchTerm(e.target.value, index)
    debouncer.call(() => onSearchValues(index), SEARCH_DEBOUNCE_MS)
  }

  const placeholderText =
    aggregateFunctionType === 'group'
      ? 'Search group column values'
      : `Search ${selectedKey} tag values`
  return (
    <>
      <BuilderCard.Menu testID={`tag-selector--container ${index}`}>
        {aggregateFunctionType !== 'group' && (
          <div
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <Dropdown
              items={keys}
              onChoose={({text}) => onKeyChange(text, index)}
              selected={selectedKey}
              buttonSize="btn-sm"
              className="dropdown-stretch"
            />
            {selectedValues.length ? (
              <div
                className="flux-tag-selector--count"
                title={`${selectedValues.length} value${
                  selectedValues.length === 1 ? '' : 's'
                } selected`}
              >
                {selectedValues.length}
              </div>
            ) : undefined}
          </div>
        )}
        <input
          className="form-control input-sm"
          placeholder={placeholderText}
          type="text"
          value={valuesSearchTerm}
          onChange={onValueTermChange}
          spellCheck={false}
          autoComplete="false"
        />
      </BuilderCard.Menu>
      <TagSelectorValues {...props} />
    </>
  )
}

const TagSelectorValues = (props: Props) => {
  const {
    selectedKey,
    index,
    values,
    valuesStatus,
    selectedValues,
    onChangeSelectedValues,
  } = props
  if (valuesStatus === RemoteDataState.Error) {
    return (
      <BuilderCard.Empty>
        {`Failed to load tag values for ${selectedKey}`}
      </BuilderCard.Empty>
    )
  }
  if (valuesStatus === RemoteDataState.NotStarted) {
    return (
      <BuilderCard.Empty>
        <WaitingText text="Waiting for tag values" />
      </BuilderCard.Empty>
    )
  }
  if (valuesStatus === RemoteDataState.Loading) {
    return (
      <BuilderCard.Empty>
        <WaitingText text="Loading tag values" />
      </BuilderCard.Empty>
    )
  }
  if (valuesStatus === RemoteDataState.Done && !values.length) {
    return (
      <BuilderCard.Empty>
        No values found <small>in the current time range</small>
      </BuilderCard.Empty>
    )
  }
  return (
    <BuilderCard.Body>
      <div className="flux-query-builder--list">
        {values.map((value: string) => {
          const active = selectedValues.includes(value)
          const onChange = () =>
            onChangeSelectedValues(
              active
                ? selectedValues.filter((x: string) => x !== value)
                : [value, ...selectedValues],
              index
            )

          const id = `flxts${index}_${value}`
          return (
            <div
              className="flux-query-builder--list-item"
              onClick={onChange}
              key={id}
              id={id}
            >
              <input type="checkbox" checked={active} onChange={onChange} />
              <label htmlFor={id}>{value}</label>
            </div>
          )
        })}
      </div>
    </BuilderCard.Body>
  )
}

// TODO replace demo UI by a real implementation
const DEMO_LOAD_DELAY = 1000
interface DemoTagSelectorProps {
  index: number
  onRemoveTagSelector: (index: number) => void
}
const DemoTagSelector = ({
  index,
  onRemoveTagSelector,
}: DemoTagSelectorProps) => {
  const [aggregateFunctionType, setAggregateFunctionType] = useState(
    'filter' as BuilderAggregateFunctionType
  )
  const [keysStatus, setKeysStatus] = useState(RemoteDataState.NotStarted)
  const [keys, setKeys] = useState([] as string[])
  const [selectedKey, setSelectedKey] = useState('')
  const [valuesSearchTerm, setValuesSearchTerm] = useState('')
  const [values, setValues] = useState([] as string[])
  const [selectedValues, setSelectedValues] = useState([] as string[])
  const [valuesStatus, setValuesStatus] = useState(undefined)

  useEffect(() => {
    setTimeout(() => setKeysStatus(RemoteDataState.Loading), DEMO_LOAD_DELAY)
    setTimeout(() => {
      setKeysStatus(RemoteDataState.Done)
      setKeys(['_measurement', '_field', 'tag1', 'tag2', 'tag3'])
      setSelectedKey('_measurement')
      setValuesStatus(RemoteDataState.NotStarted)
    }, DEMO_LOAD_DELAY * 2)
  }, [])

  useEffect(() => {
    if (valuesStatus === RemoteDataState.NotStarted) {
      setTimeout(
        () => setValuesStatus(RemoteDataState.Loading),
        DEMO_LOAD_DELAY
      )
      setTimeout(() => {
        setValuesStatus(RemoteDataState.Done)
        const demoValues =
          aggregateFunctionType === 'filter'
            ? 'a a1 a2 a3 a4 a5 a6 a7 a8 ba b2 b3 b4 c1 c3 ca2 ca3 ca4 ca5 ca6 ca7'
            : '_measurement _field tag1 tag2 tag3'
        const newVals = demoValues
          .split(' ')
          .filter(v => v.includes(valuesSearchTerm))
        setValues(newVals)
        setSelectedValues(selectedValues.filter(x => newVals.includes(x)))
      }, DEMO_LOAD_DELAY * 2)
    }
  }, [valuesStatus])
  return (
    <TagSelector
      index={index}
      aggregateFunctionType={aggregateFunctionType}
      onRemoveTagSelector={onRemoveTagSelector}
      onChangeFunctionType={(type, i) => {
        console.error('DemoTagSelector.onChangeFunctionType', type, i)
        setAggregateFunctionType(type)
        setValuesStatus(RemoteDataState.NotStarted)
      }}
      keysStatus={keysStatus}
      keys={keys}
      selectedKey={selectedKey}
      onKeyChange={(key, i) => {
        console.error('DemoTagSelector.onKeyChange', key, i)
        setSelectedKey(key)
        setSelectedValues([])
        setValuesStatus(RemoteDataState.NotStarted)
      }}
      valuesSearchTerm={valuesSearchTerm}
      onChangeValuesSearchTerm={(term, i) => {
        console.error('DemoTagSelector.onChangeValuesSearchTerm', term, i)
        setValuesSearchTerm(term)
      }}
      onSearchValues={(i: number) => {
        setValuesStatus(RemoteDataState.NotStarted)
        console.error('DemoTagSelector.onSearchValues', i)
      }}
      valuesStatus={valuesStatus}
      values={values}
      selectedValues={selectedValues}
      onChangeSelectedValues={(newValues, i) => {
        console.error('DemoTagSelector.onChangeSelectedValues', newValues, i)
        setSelectedValues(newValues)
      }}
    />
  )
}

export default DemoTagSelector
