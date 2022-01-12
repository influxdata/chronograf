import React, {FunctionComponent, useState} from 'react'
import {ComponentSize, SlideToggle} from 'src/reusable_ui'
import ReactTooltip from 'react-tooltip'

import BuilderCard from './BuilderCard'
import WindowPeriod from './WindowPeriod'
import {FUNCTIONS} from 'src/shared/constants/queryBuilder'

interface Props {
  children?: JSX.Element
}
const AggregationSelector: FunctionComponent = ({children}: Props) => {
  const [period, setPeriod] = useState('auto')
  const [fillMissing, setFillMissing] = useState(false)

  const functions = FUNCTIONS.map(f => f.name)
  const [selectedFunctions, setSelectedFunctions] = useState(['mean'])
  return (
    <BuilderCard className="aggregation-selector" testID="aggregation-selector">
      {children}
      <BuilderCard.Header
        title="Window Period"
        className="aggregation-selector-header"
      />
      <BuilderCard.Body
        scrollable={false}
        addPadding={false}
        className="aggregation-selector-body"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          <WindowPeriod
            autoPeriod="10s"
            selected={period}
            onChoose={setPeriod}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              marginTop: '3px',
              alignItems: 'center',
            }}
          >
            <SlideToggle
              size={ComponentSize.ExtraSmall}
              active={fillMissing}
              onChange={() => setFillMissing(!fillMissing)}
            />
            <div style={{paddingLeft: '5px'}}>Fill Missing Values</div>
            <div
              style={{
                paddingLeft: '5px',
                flexGrow: 1,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <div data-tip="For windows without data, create an empty window and fill it with a null aggregate value">
                <span
                  style={{
                    borderRadius: '50%',
                    backgroundColor: '#bec2cc',
                    color: '#0f0e15',
                    width: '17px',
                    height: '17px',
                    display: 'inline-block',
                    textAlign: 'center',
                    lineHeight: '18px',
                    fontWeight: 900,
                    cursor: 'default',
                  }}
                >
                  ?
                </span>
              </div>
              <ReactTooltip
                effect="solid"
                html={false}
                place="left"
                class="influx-tooltip"
              />
            </div>
          </div>
        </div>
      </BuilderCard.Body>
      <BuilderCard.Header
        title="Aggregate Function"
        className="aggregation-selector-header"
      />
      <BuilderCard.Body>
        <div className="flux-query-builder--list">
          {functions.map(fn => {
            const active = selectedFunctions.includes(fn)
            return (
              <div
                className="flux-query-builder--list-item compact"
                onClick={() =>
                  setSelectedFunctions(
                    active
                      ? selectedFunctions.filter(x => x !== fn)
                      : [fn, ...selectedFunctions]
                  )
                }
                key={fn}
              >
                <input type="checkbox" id={fn} checked={active} />
                <label htmlFor="{fn}">{fn}</label>
              </div>
            )
          })}
        </div>
      </BuilderCard.Body>
    </BuilderCard>
  )
}

export default AggregationSelector
