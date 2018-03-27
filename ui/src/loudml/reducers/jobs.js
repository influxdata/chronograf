import {
    START_JOB,
    STOP_JOB,
    UPDATE_JOBS,
} from 'src/loudml/constants'

const initialState = {
  jobs: [],
  isFetching: true
}

export default function jobs(state = initialState, action) {
	switch (action.type) {
    	case START_JOB: {
            /* add it */
			return {
				...state,
				jobs: [
					...state.jobs,
					action.payload
				]
            }
    	}
    	case STOP_JOB: {
            /* remove it */
			return {
				...state,
				jobs: [...state.jobs].filter(job => job.name !== action.payload.name)
			}
        }
        case UPDATE_JOBS: {
            return {
                ...state,
                jobs: [...state.jobs]
                    .map(job => Object.assign(
                        {},
                        job,
                        action.payload.filter(j => j.id === job.id)[0])
                    )
            }
        }
        default:
            return state
  	}

}
