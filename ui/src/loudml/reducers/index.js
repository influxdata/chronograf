import { combineReducers } from 'redux'

import models from 'src/loudml/reducers/models'
import jobs from 'src/loudml/reducers/jobs'

const loudml = combineReducers({
  models,
  jobs
})

export default {loudml}
