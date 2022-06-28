import appReducer from 'src/shared/reducers/app'
import {
  enablePresentationMode,
  disablePresentationMode,
  setAutoRefresh,
  toggleTemplateVariableControlBar,
  setTimeZone,
  toggleShowAnnotationControls,
} from 'src/shared/actions/app'

import {TimeZones} from 'src/types'
import {AnnotationsDisplaySetting} from 'src/types/annotations'
import {
  addingAnnotation,
  setAnnotationsDisplaySetting,
} from 'src/shared/actions/annotations'

describe('Shared.Reducers.appReducer', () => {
  const initialState = {
    ephemeral: {
      inPresentationMode: false,
    },
    persisted: {
      timeZone: TimeZones.Local,
      autoRefresh: 0,
      showTemplateVariableControlBar: false,
      showAnnotationControls: false,
      annotationsDisplaySetting: AnnotationsDisplaySetting.HideAnnotations,
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

  it('should handle TOGGLE_SHOW_ANNOTATION_CONTROLS', () => {
    const reducedState = appReducer(
      initialState,
      toggleShowAnnotationControls()
    )

    expect(reducedState.persisted.showAnnotationControls).toBe(true)
  })

  it('should handle SET_TIME_ZONE', () => {
    const state = appReducer(initialState, setTimeZone(TimeZones.UTC))

    expect(state.persisted.timeZone).toBe(TimeZones.UTC)
  })

  it('should handle ADDING_ANNOTATION', () => {
    const reducedState = appReducer(initialState, addingAnnotation())

    expect(reducedState.persisted.annotationsDisplaySetting).toBe(
      AnnotationsDisplaySetting.FilterAnnotationsByTag
    )
  })
  it('should handle SET_ANNOTATIONS_DISPLAY_SETTING', () => {
    const reducedState = appReducer(
      initialState,
      setAnnotationsDisplaySetting(
        AnnotationsDisplaySetting.FilterAnnotationsByTag
      )
    )

    expect(reducedState.persisted.annotationsDisplaySetting).toBe(
      AnnotationsDisplaySetting.FilterAnnotationsByTag
    )
  })
})
