import React from 'react'

import {connect} from 'react-redux'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {ComponentSize, SlideToggle} from 'src/reusable_ui'
import ReactTooltip from 'react-tooltip'
import BuilderCard from './BuilderCard'
import WindowPeriod from './WindowPeriod'
import {FUNCTION_NAMES} from './util/constants'
import {AggregationSelectorState} from './types'
import {actionCreators} from './actions/aggregation'

interface Callbacks {
  notify: (notification: any) => void
  setPeriod: (period: string) => void
  setFillMissing: (fillMissing: boolean) => void
  setSelectedFunctions: (fns: string[]) => void
}
interface OwnProps {
  defaultPeriod: string
}
type Props = AggregationSelectorState & OwnProps & Callbacks

const AggregationSelector = (props: Props & {children?: JSX.Element}) => {
  const {
    defaultPeriod,
    period,
    fillMissing,
    selectedFunctions,
    setPeriod,
    setFillMissing,
    setSelectedFunctions,
  } = props

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
            autoPeriod={defaultPeriod}
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
              setSelectedFunctions(newSelected)
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

const mstp = (state: any): AggregationSelectorState => {
  return state?.fluxQueryBuilder?.aggregation as AggregationSelectorState
}
const mdtp = {
  notify: notifyAction,
  setFillMissing: actionCreators.setFillMissing,
  setPeriod: actionCreators.setPeriod,
  setSelectedFunctions: actionCreators.setSelectedFunctions,
}
export default connect(mstp, mdtp)(AggregationSelector)
