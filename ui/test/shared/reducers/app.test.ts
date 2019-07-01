import appReducer from 'src/shared/reducers/app'
import {
  enablePresentationMode,
  disablePresentationMode,
  setAutoRefresh,
  toggleTemplateVariableControlBar,
  setTimeZone,
} from 'src/shared/actions/app'

import {TimeZones} from 'src/types'

describe('Shared.Reducers.appReducer', () => {
  const initialState = {
    ephemeral: {
      inPresentationMode: false,
    },
    persisted: {
      timeZone: TimeZones.Local,
      autoRefresh: 0,
      showTemplateVariableControlBar: false,
    },
  }

  it('should handle ENABLE_PRESENTATION_MODE', () => {
    const reducedState = appReducer(initialState, enablePresentationMode())

    expect(reducedState.ephemeral.inPresentationMode).toBe(true)
  })

  it('should handle DISABLE_PRESENTATION_MODE', () => {
    Object.assign(initialState, {ephemeral: {inPresentationMode: true}})

    const reducedState = appReducer(initialState, disablePresentationMode())

    expect(reducedState.ephemeral.inPresentationMode).toBe(false)
  })

  it('should handle SET_AUTOREFRESH', () => {
    const expectedMs = 15000

    const reducedState = appReducer(initialState, setAutoRefresh(expectedMs))

    expect(reducedState.persisted.autoRefresh).toBe(expectedMs)
  })

  it('should handle TOGGLE_TEMPLATE_VARIABLE_CONTROL_BAR', () => {
    const reducedState = appReducer(
      initialState,
      toggleTemplateVariableControlBar()
    )

    expect(reducedState.persisted.showTemplateVariableControlBar).toBe(true)
  })

  it('should handle SET_TIME_ZONE', () => {
    const state = appReducer(initialState, setTimeZone(TimeZones.UTC))

    expect(state.persisted.timeZone).toBe(TimeZones.UTC)
  })
})
