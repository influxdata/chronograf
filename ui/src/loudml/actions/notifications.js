import {FIVE_SECONDS, TEN_SECONDS, INFINITE} from 'shared/constants/index'

const notifySuccess = message => ({
    type: 'success',
    icon: 'loudml-bold',
    duration: FIVE_SECONDS,
    message,
})

const notifyError = (duration, message) => ({
    type: 'error',
    icon: 'loudml-bold',
    duration,
    message,
})

export const notifyErrorGettingVersion = message => notifyError(
    TEN_SECONDS,
    `cannot get api version: ${message}`,
)

export const notifyErrorGettingModel = message => notifyError(
    TEN_SECONDS,
    `cannot get model: ${message}`,
)

export const notifyErrorGettingModels = message => notifyError(
    TEN_SECONDS,
    `cannot get models: ${message}`,
)

export const notifyModelDeleted = name => notifySuccess(`model ${name} deleted successfully`)

export const notifyModelDeleteFailed = (name, message) => notifyError(
    TEN_SECONDS,
    `cannot delete '${name}' model: ${message}`,
)

export const notifyModelCreated = name => notifySuccess(`model ${name} created`)

export const notifyModelCreationFailed = (name, message) => notifyError(
    INFINITE,
    `cannot create '${name}' model: ${message}`,
)

export const notifyModelUpdated = () => notifySuccess("model updated")

export const notifyModelUpdateFailed = (name, message) => notifyError(
    INFINITE,
    `cannot update '${name}' model: ${message}`,
)

export const notifyModelTraining = job => notifySuccess(`Training job for model '${job.name}' queued`)

export const notifyModelTrainingFailed = (name, message) => notifyError(
    INFINITE,
    `Could not start '${name}' model training: ${message}`,
)

export const notifyModelStarting = name => notifySuccess(`Prediction for model ${name} started`)

export const notifyModelStartingFailed = (name, message) => notifyError(
    INFINITE,
    `Could not start prediction job for model '${name}': ${message}`,
)

export const notifyModelForecasting = job => notifySuccess(`Forecast job ${job.name} queued`)

export const notifyModelForecastingFailed = (name, message) => notifyError(
    INFINITE,
    `Could not start forecast job for model '${name}': ${message}`,
)

export const notifyModelStopped = name => notifySuccess(`Prediction on '${name}' stopped`)

export const notifyModelStoppedFailed = (name, message) => notifyError(
    INFINITE,
    `Could not stop prediction job for model '${name}': ${message}`,
)

export const notifyJobSuccess = job => notifySuccess(`Job ${job.name} ${job.state}`)

export const notifyJobFailed = job => notifyError(
    INFINITE,
    `Job ${job.type} failed for model '${job.name}': ${job.error}`,
)

export const notifyJobStopped = name => notifySuccess(`job on model '${name}' stopped`)

export const notifyJobStoppedFailed = (name, message) => notifyError(
    INFINITE,
    `Stopping job failed for model '${name}': ${message}`,
)

export const notifyDashboardCreated = name => notifySuccess(`prediction dashboard for model '${name}' created`)

export const notifyDashboardCreationFailed = (name, message) => notifyError(
    INFINITE,
    `cannot create prediction dashboard for model '${name}': ${message}`,
)

export const notifyDashboardCellCreated = name => notifySuccess(`prediction cell for model '${name}' created`)

export const notifyDashboardCellCreationFailed = (name, message) => notifyError(
    INFINITE,
    `cannot create prediction cell for model '${name}': ${message}`,
)

export const notifyErrorGettingDatasources = message => notifyError(
    TEN_SECONDS,
    `cannot get Loud ML datasources: ${message}`,
)

export const notifyErrorGettingModelHook = (model, hook, message) => notifyError(
    TEN_SECONDS,
    `cannot get hook '${hook}' for model ${model}: ${message}`,
)
