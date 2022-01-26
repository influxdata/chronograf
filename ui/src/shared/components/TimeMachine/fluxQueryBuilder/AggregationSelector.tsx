import React, {useState} from 'react'

import {connect} from 'react-redux'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {fluxWizardError} from 'src/shared/copy/notifications'

import {ComponentSize, SlideToggle} from 'src/reusable_ui'
import ReactTooltip from 'react-tooltip'
import BuilderCard from './BuilderCard'
import WindowPeriod from './WindowPeriod'
import {FUNCTION_NAMES} from 'src/shared/constants/queryBuilder'
import {TimeRange} from 'src/types'

interface AggregationViewProps {
  timeRange: TimeRange
  period: string
  fillMissing: boolean
  selectedFunctions: string[]
}
interface Props extends AggregationViewProps {
  notify: (notification: any) => void
  children?: JSX.Element

  setPeriod: (period: string) => void
  setFillMissing: (fillMissing: boolean) => void
  setSelectedFunctions: (fns: string[]) => void
}
const AggregationSelector = (props: Props) => {
  const {
    period,
    setPeriod,
    fillMissing,
    setFillMissing,
    selectedFunctions,
    setSelectedFunctions,
  } = props
  const autoPeriod = '10s' // TODO compute from timeRange

  return (
    <BuilderCard className="aggregation-selector" testID="aggregation-selector">
      {props.children}
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
            autoPeriod={autoPeriod}
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
          {FUNCTION_NAMES.map(fn => {
            const active = selectedFunctions.includes(fn)
            const onChange = () => {
              const newSelected = active
                ? selectedFunctions.filter(x => x !== fn)
                : [fn, ...selectedFunctions]
              // at least one function must be selected
              if (newSelected.length) {
                setSelectedFunctions(newSelected)
              } else {
                props.notify(
                  fluxWizardError(
                    'You must have at least one aggregation function selected'
                  )
                )
              }
            }

            const id = `flx-agrselect${fn}`
            return (
              <div
                className="flux-query-builder--list-item compact"
                onClick={onChange}
                key={id}
                id={id}
              >
                <input type="checkbox" checked={active} onChange={onChange} />
                <label htmlFor={id}>{fn}</label>
              </div>
            )
          })}
        </div>
      </BuilderCard.Body>
    </BuilderCard>
  )
}

const DemoAggregationSelector = ({
  notify,
  timeRange,
  children,
}: {
  notify: (notification: any) => void
  timeRange: TimeRange
  children?: JSX.Element
}) => {
  const [period, setPeriod] = useState('auto')
  const [fillMissing, setFillMissing] = useState(false)
  const [selectedFunctions, setSelectedFunctions] = useState(['mean'])

  return (
    <AggregationSelector
      notify={notify}
      timeRange={timeRange}
      period={period}
      setPeriod={setPeriod}
      fillMissing={fillMissing}
      setFillMissing={setFillMissing}
      selectedFunctions={selectedFunctions}
      setSelectedFunctions={setSelectedFunctions}
    >
      {children}
    </AggregationSelector>
  )
}

export default connect(null, {notify: notifyAction})(DemoAggregationSelector)
