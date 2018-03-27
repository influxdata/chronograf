import {INFLUXQL_FUNCTIONS} from 'src/data_explorer/constants'

export const DEFAULT_LOUDML_RP = 'autogen'

export const DEFAULT_MODEL = {
    bucket_interval: '20m',
    default_datasource: null,
    features: {},
    interval: '1m',
    max_evals: 100,
    name: '',   // input value connot be null
    offset: '10s',
    seasonality: {
        daytime: false,
        weekday: false,
    },
    span: 10,
    forecast: 5,
    type: 'timeseries',
    min_threshold: 75,
    max_threshold: 75,
}

export const DEFAULT_FEATURE = {
    name: '',      // input value connot be null
    measurement: null,
    field: null,
    metric: 'mean',
    default: null,
    io: 'io',
    anomaly_type: 'low_high',
    match_all: [],
}

export const DEFAULT_METRICS = [
    ...INFLUXQL_FUNCTIONS,
    'mode',
    '5percentile',
    '10percentile',
    '90percentile',
    '95percentile',
]

export const DEFAULT_IO  = [
    { text: 'in', value: 'i', },
    { text: 'out', value: 'o', },
    { text: 'in/out', value: 'io', }
]
                                    

export const MODEL_CREATED = 'MODEL_CREATED';
export const MODEL_UPDATED = 'MODEL_UPDATED';
export const MODELS_LOADED = 'MODELS_LOADED';
export const MODEL_DELETED = 'MODEL_DELETED';
export const START_JOB = 'START_LOUDML_JOB';
export const STOP_JOB = 'STOP_LOUDML_JOB';
export const UPDATE_JOBS = 'UPDATE_LOUDML_JOBS'
