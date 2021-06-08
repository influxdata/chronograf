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
    case 'DELETE_FLUX_TASK_SUCCESS': {
      const {taskId} = action.payload
      return state.filter(t => t.id !== taskId)
    }
  }
  return state
}
