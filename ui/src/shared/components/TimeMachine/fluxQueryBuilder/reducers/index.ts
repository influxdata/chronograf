import {combineReducers} from 'redux'
import buckets from './buckets'
import aggregation from './aggregation'
import tags from './tags'

export default combineReducers({buckets, aggregation, tags})
