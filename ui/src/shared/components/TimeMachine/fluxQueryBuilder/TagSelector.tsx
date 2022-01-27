import React, {ChangeEvent, useEffect, useMemo, useState} from 'react'
import BuilderCard from './BuilderCard'
import DefaultDebouncer from 'src/shared/utils/debouncer'
import {RemoteDataState, BuilderAggregateFunctionType} from 'src/types'
import SearchableDropdown from '../../SearchableDropdown'
import WaitingText from '../../WaitingText'
import {TagSelectorState} from './types'

const SEARCH_DEBOUNCE_MS = 400

function renderType(type: BuilderAggregateFunctionType) {
  if (type === 'group') {
    return 'Group'
  }
  return 'Filter'
}

interface Callbacks {
  onRemoveTagSelector: (tagId: string) => void
  onChangeFunctionType: (
    tagId: string,
    type: BuilderAggregateFunctionType
  ) => void
  onSelectKey: (tagId: string, key: string) => void
  onChangeKeysSearchTerm: (tagId: string, searchTerm: string) => void
  onSearchKeys: (tagId: string) => void
  onChangeValuesSearchTerm: (tagId: string, searchTerm: string) => void
  onSearchValues: (tagId: string) => void
  onSelectValues: (tagId: string, values: string[]) => void
}
type Props = TagSelectorState & Callbacks

const TagSelector = (props: Props) => {
  const {
    tagId,
    aggregateFunctionType,
    onRemoveTagSelector,
    onChangeFunctionType,
  } = props

  return (
    <BuilderCard>
      <BuilderCard.DropdownHeader
        options={['Filter', 'Group']}
        selectedOption={renderType(aggregateFunctionType)}
        onDelete={tagId !== '0' ? () => onRemoveTagSelector(tagId) : undefined}
        onSelect={val =>
          onChangeFunctionType(tagId, val === 'Filter' ? 'filter' : 'group')
        }
      />
      <TagSelectorBody {...props} />
    </BuilderCard>
  )
}

const TagSelectorBody = (props: Props) => {
  const {
    aggregateFunctionType,
    tagId,
    keys,
    keysStatus,
    selectedKey,
    onSelectKey,
    valuesSearchTerm,
    onChangeValuesSearchTerm,
    onSearchValues,
    keysSearchTerm,
    onChangeKeysSearchTerm,
    onSearchKeys,
    selectedValues,
  } = props

  if (keysStatus === RemoteDataState.Error) {
    return <BuilderCard.Empty>Failed to load tag keys</BuilderCard.Empty>
  }

  if (keysStatus === RemoteDataState.Done && !keys.length && !keysSearchTerm) {
    return (
      <BuilderCard.Empty testID="empty-tag-keys">
        No tag keys found <small>in the current time range</small>
      </BuilderCard.Empty>
    )
  }

  const debouncer = useMemo(() => new DefaultDebouncer(), [])
  useEffect(() => () => debouncer.cancelAll(), [])
  function onValueTermChange(e: ChangeEvent<HTMLInputElement>) {
    onChangeValuesSearchTerm(tagId, e.target.value)
    debouncer.call(() => onSearchValues(tagId), SEARCH_DEBOUNCE_MS)
  }
  function onKeyTermChange(term: string) {
    onChangeKeysSearchTerm(tagId, term)
    debouncer.call(() => onSearchKeys(tagId), SEARCH_DEBOUNCE_MS)
  }

  const placeholderText =
    aggregateFunctionType === 'group'
      ? 'Search group column values'
      : `Search ${selectedKey} tag values`
  return (
    <>
      <BuilderCard.Menu testID={`tag-selector--container`}>
        {aggregateFunctionType !== 'group' && (
          <div
            style={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <SearchableDropdown
              items={keys}
              onChoose={(key: string) => onSelectKey(tagId, key)}
              searchTerm={keysSearchTerm}
              onChangeSearchTerm={onKeyTermChange}
              selected={selectedKey}
              buttonSize="btn-sm"
              className="dropdown-stretch"
              status={keysStatus}
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
        {keysStatus === RemoteDataState.Done ? (
          <input
            className="form-control input-sm"
            placeholder={placeholderText}
            type="text"
            value={valuesSearchTerm}
            onChange={onValueTermChange}
            spellCheck={false}
            autoComplete="false"
          />
        ) : undefined}
      </BuilderCard.Menu>
      <TagSelectorValues {...props} />
    </>
  )
}

const TagSelectorValues = (props: Props) => {
  const {
    keysStatus,
    selectedKey,
    tagId,
    values,
    valuesStatus,
    selectedValues,
    onSelectValues,
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
            onSelectValues(
              tagId,
              active
                ? selectedValues.filter((x: string) => x !== value)
                : [value, ...selectedValues]
            )

          const divId = `flxts${tagId}_${value}`
          return (
            <div
              className="flux-query-builder--list-item"
              onClick={onChange}
              key={divId}
              id={divId}
            >
              <input type="checkbox" checked={active} onChange={onChange} />
              <label htmlFor={divId}>{value}</label>
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
  tagId: string
  onRemoveTagSelector: (tagId: string) => void
}
const DemoTagSelector = ({
  tagId,
  onRemoveTagSelector,
}: DemoTagSelectorProps) => {
  const [aggregateFunctionType, setAggregateFunctionType] = useState(
    'filter' as BuilderAggregateFunctionType
  )
  const [keysChanged, setKeysChanged] = useState(0)
  const [keysStatus, setKeysStatus] = useState(RemoteDataState.NotStarted)
  const [keys, setKeys] = useState([] as string[])
  const [selectedKey, setSelectedKey] = useState('')
  const [valuesSearchTerm, setValuesSearchTerm] = useState('')
  const [values, setValues] = useState([] as string[])
  const [selectedValues, setSelectedValues] = useState([] as string[])
  const [valuesChanged, setValuesChanged] = useState(0)
  const [valuesStatus, setValuesStatus] = useState(undefined)
  const [keysSearchTerm, setKeysSearchTerm] = useState('')

  useEffect(() => {
    setKeysStatus(RemoteDataState.NotStarted)
    setTimeout(() => setKeysStatus(RemoteDataState.Loading), DEMO_LOAD_DELAY)
    setTimeout(() => {
      setKeysStatus(RemoteDataState.Done)
      const newKeys = [
        '_measurement',
        '_field',
        'tag1',
        'tag2',
        'tag3',
      ].filter(x => x.includes(keysSearchTerm))
      setKeys(newKeys)
      if (!newKeys.includes(selectedKey)) {
        setSelectedKey(newKeys.length ? newKeys[0] : '')
      }
      setValuesStatus(RemoteDataState.NotStarted)
      setValuesChanged(valuesChanged + 1)
    }, DEMO_LOAD_DELAY * 2)
  }, [keysChanged])

  useEffect(() => {
    setValuesStatus(RemoteDataState.NotStarted)
    setTimeout(() => setValuesStatus(RemoteDataState.Loading), DEMO_LOAD_DELAY)
    setTimeout(() => {
      setValuesStatus(RemoteDataState.Done)
      let demoValues: string[]
      if (aggregateFunctionType === 'filter') {
        if (selectedKey) {
          demoValues = 'a a1 a2 a3 a4 a5 a6 a7 a8 ba b2 b3 b4 c1 c3 ca2 ca3 ca4 ca5 ca6 ca7'.split(
            ' '
          )
        } else {
          demoValues = []
        }
      } else {
        demoValues = '_measurement _field tag1 tag2 tag3'.split(' ')
      }
      const newVals = demoValues.filter(v => v.includes(valuesSearchTerm))
      setValues(newVals)
      setSelectedValues(selectedValues.filter(x => newVals.includes(x)))
    }, DEMO_LOAD_DELAY * 2)
  }, [valuesChanged])
  return (
    <TagSelector
      tagId={tagId}
      aggregateFunctionType={aggregateFunctionType}
      onRemoveTagSelector={onRemoveTagSelector}
      onChangeFunctionType={(i, type) => {
        console.error('DemoTagSelector.onChangeFunctionType', type, i)
        setAggregateFunctionType(type)
      }}
      keysStatus={keysStatus}
      keys={keys}
      selectedKey={selectedKey}
      onSelectKey={(i, key) => {
        console.error('DemoTagSelector.onKeyChange', key, i)
        setSelectedKey(key)
        setSelectedValues([])
        setValuesChanged(valuesChanged + 1)
      }}
      keysSearchTerm={keysSearchTerm}
      onChangeKeysSearchTerm={(i, term) => {
        console.error('DemoTagSelector.onChangeKeysSearchTerm', term, i)
        setKeysSearchTerm(term)
      }}
      onSearchKeys={i => {
        setKeysChanged(valuesChanged + 1)
        console.error('DemoTagSelector.onSearchKeys', i)
      }}
      valuesSearchTerm={valuesSearchTerm}
      onChangeValuesSearchTerm={(i, term) => {
        console.error('DemoTagSelector.onChangeValuesSearchTerm', term, i)
        setValuesSearchTerm(term)
      }}
      onSearchValues={i => {
        setValuesChanged(valuesChanged + 1)
        console.error('DemoTagSelector.onSearchValues', i)
      }}
      valuesStatus={valuesStatus}
      values={values}
      selectedValues={selectedValues}
      onSelectValues={(i, newValues) => {
        console.error('DemoTagSelector.onSelectValues', newValues, i)
        setSelectedValues(newValues)
      }}
    />
  )
}

export default DemoTagSelector
