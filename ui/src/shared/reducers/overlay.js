export const initialState = {}

export default function overlay(state = initialState, action) {
  switch (action.type) {
    case 'SHOW_OVERLAY': {
      const {childNode} = action.payload

      return {childNode}
    }

    case 'DISMISS_OVERLAY': {
      return {}
    }
  }

  return state
}
