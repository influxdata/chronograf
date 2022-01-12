import React, {useState} from 'react'
import Dropdown from 'src/shared/components/Dropdown'
import {DURATIONS} from 'src/shared/constants/queryBuilder'

interface Props {
  selected: string | 'auto'
  autoPeriod: string
  onChoose: (value: string | 'auto') => void
}

const WindowPeriod = ({selected, autoPeriod, onChoose}: Props) => {
  const [customDuration, setCustomDuration] = useState(
    undefined as string | undefined
  )

  let items = DURATIONS
  const autoValue = `auto (${autoPeriod})`
  if (selected === 'auto') {
    selected = autoValue
  }
  if (!items.includes(selected) && selected !== autoValue) {
    const selectedText = `custom (${selected})`
    items = [
      ({text: selectedText, value: selected} as unknown) as string,
      ...items,
    ]
    selected = selectedText
  } else {
    items = [`custom`, ...items]
  }
  items = [autoValue, ...items]
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      {customDuration !== undefined ? (
        <input
          className="form-control input-sm"
          placeholder="Search for a bucket"
          type="text"
          value={customDuration}
          onChange={e => setCustomDuration(e.target.value)}
          onKeyUp={e => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              setCustomDuration(undefined)
            }
            if (e.key === 'Enter') {
              e.stopPropagation()
              setCustomDuration(undefined)
              onChoose(customDuration)
            }
          }}
          spellCheck={false}
          autoComplete="false"
          autoFocus={true}
        />
      ) : (
        <Dropdown
          items={items}
          onChoose={({text, value}) => {
            if (text.startsWith('custom')) {
              setCustomDuration(value ?? '')
              return
            }
            onChoose(text.startsWith('auto') ? 'auto' : text)
          }}
          selected={selected}
          buttonSize="btn-sm"
          className="dropdown-stretch"
        />
      )}
    </div>
  )
}

export default WindowPeriod
