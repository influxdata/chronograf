import {
	MODELS_LOADED,
	MODEL_DELETED,
	MODEL_UPDATED,
	MODEL_CREATED
} from 'src/loudml/constants'

const initialState = {
  models: [],
  isFetching: true
}

export default function models(state = initialState, action) {
	switch (action.type) {
		case MODELS_LOADED: {
			return {
				...state,
				models: action.payload,
				isFetching: false
			}
    	}
		case MODEL_CREATED: {
			return {
				...state,
				models: [
					...state.models,
					{
						settings: {...action.payload},
						state: {}	// empty state
					}
				]
			}
    	}
    	case MODEL_UPDATED: {
			return {
				...state,
				models: [...state.models]
					.map(model => {
						if (model.settings.name === action.payload.name) {
							return {
								...model,
								settings: {...action.payload}
							}
						}
						return model
					})
			}
    	}
    	case MODEL_DELETED: {
			return {
				...state,
				models: [...state.models].filter(model => model.settings.name !== action.payload)
			}
    	}
  	}

	return state
}
