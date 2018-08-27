import {
  ADDING,
  EDITING,
  DEFAULT_ANNOTATION,
} from 'src/shared/annotations/helpers'

import {Action} from 'src/shared/actions/annotations'
import {
  Annotation,
  TagFilter,
  AnnotationsDisplaySetting,
} from 'src/types/annotations'

export interface AnnotationState {
  annotations: {
    [annotationId: string]: Annotation
  }
  mode: string
  displaySetting: AnnotationsDisplaySetting
  isTempHovering: boolean
  editingAnnotation?: string
  addingAnnotation?: Annotation
  tagKeys?: string[]
  tagValues: {
    [tagKey: string]: string[]
  }
  tagFilters: {
    [dashboardID: number]: {
      [tagFilterID: string]: TagFilter
    }
  }
}

const initialState = {
  mode: null,
  isTempHovering: false,
  displaySetting: AnnotationsDisplaySetting.HideAnnotations,
  annotations: {},
  tagKeys: null,
  tagValues: {},
  tagFilters: {},
}

const annotationsReducer = (
  state: AnnotationState = initialState,
  action: Action
): AnnotationState => {
  switch (action.type) {
    case 'EDITING_ANNOTATION': {
      return {
        ...state,
        mode: EDITING,
      }
    }

    case 'DISMISS_EDITING_ANNOTATION': {
      return {
        ...state,
        mode: null,
      }
    }

    case 'ADDING_ANNOTATION': {
      return {
        ...state,
        mode: ADDING,
        isTempHovering: true,
        addingAnnotation: DEFAULT_ANNOTATION(),
        displaySetting: AnnotationsDisplaySetting.FilterAnnotationsByTag,
      }
    }

    case 'ADDING_ANNOTATION_SUCCESS': {
      return {
        ...state,
        isTempHovering: false,
        mode: null,
      }
    }

    case 'DISMISS_ADDING_ANNOTATION': {
      return {
        ...state,
        isTempHovering: false,
        mode: null,
        addingAnnotation: null,
      }
    }

    case 'MOUSEENTER_TEMP_ANNOTATION': {
      const newState = {
        ...state,
        isTempHovering: true,
      }

      return newState
    }

    case 'MOUSELEAVE_TEMP_ANNOTATION': {
      const newState = {
        ...state,
        isTempHovering: false,
      }

      return newState
    }

    case 'SET_ANNOTATIONS': {
      const annotations = action.payload.annotations.reduce(
        (acc, a) => ({
          ...acc,
          [a.id]: a,
        }),
        {}
      )

      return {
        ...state,
        annotations,
      }
    }

    case 'UPDATE_ANNOTATION': {
      const {annotation} = action.payload

      return {
        ...state,
        annotations: {
          ...state.annotations,
          [annotation.id]: annotation,
        },
      }
    }

    case 'SET_ADDING_ANNOTATION': {
      return {
        ...state,
        addingAnnotation: action.payload,
      }
    }

    case 'DELETE_ANNOTATION': {
      const {annotation} = action.payload

      return {
        ...state,
        annotations: {
          ...state.annotations,
          [annotation.id]: null,
        },
      }
    }

    case 'ADD_ANNOTATION': {
      const {annotation} = action.payload

      return {
        ...state,
        annotations: {
          ...state.annotations,
          [annotation.id]: annotation,
        },
      }
    }

    case 'SET_EDITING_ANNOTATION': {
      return {
        ...state,
        editingAnnotation: action.payload,
      }
    }

    case 'UPDATE_TAG_FILTER': {
      const {tagFilter, dashboardID} = action.payload
      const dashboardTagFilters = state.tagFilters[dashboardID] || {}

      return {
        ...state,
        tagFilters: {
          [dashboardID]: {
            ...dashboardTagFilters,
            [tagFilter.id]: tagFilter,
          },
        },
      }
    }

    case 'DELETE_TAG_FILTER': {
      const {tagFilter, dashboardID} = action.payload
      const dashboardTagFilters = state.tagFilters[dashboardID] || {}

      return {
        ...state,
        tagFilters: {
          ...state.tagFilters,
          [dashboardID]: {
            ...dashboardTagFilters,
            [tagFilter.id]: null,
          },
        },
      }
    }

    case 'SET_TAG_KEYS': {
      return {
        ...state,
        tagKeys: action.payload,
      }
    }

    case 'SET_TAG_VALUES': {
      const {tagKey, tagValues} = action.payload

      return {
        ...state,
        tagValues: {
          ...state.tagValues,
          [tagKey]: tagValues,
        },
      }
    }

    case 'SET_DISPLAY_SETTING': {
      return {
        ...state,
        displaySetting: action.payload,
      }
    }
  }

  return state
}

export default annotationsReducer
