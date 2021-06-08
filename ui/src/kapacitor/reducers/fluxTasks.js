export default function fluxTasks(state = [], action) {
  switch (action.type) {
    case 'LOAD_FLUX_TASKS': {
      return action.payload.tasks
    }
    case 'UPDATE_FLUX_TASK_STATUS_SUCCESS': {
      const {task, status} = action.payload
      return state.map(t => {
        if (task.id === t.id) {
          return {...task, status}
        }
        return t
      })
    }
  }
  return state
}
