import React from 'react'
import Dropdown from 'src/shared/components/Dropdown'
import {DURATIONS} from 'src/shared/constants/queryBuilder'

interface Props {
  selected: string | 'auto'
  autoPeriod: string
  onChoose: (value: string | 'auto') => void
}

const WindowPeriod = ({selected, autoPeriod, onChoose}: Props) => {
  let items = DURATIONS
  const autoValue = `auto (${autoPeriod})`
  if (selected === 'auto') {
    selected = autoValue
  } else if (!DURATIONS.includes(selected)) {
    items = [selected, ...items]
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
      <Dropdown
        items={items}
        onChoose={({text}) => {
          onChoose(text.startsWith('auto') ? 'auto' : text)
        }}
        selected={selected}
        buttonSize="btn-sm"
        className="dropdown-stretch"
      />
    </div>
  )
}

export default WindowPeriod
