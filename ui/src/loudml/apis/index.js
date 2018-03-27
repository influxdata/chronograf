import AJAX from 'utils/ajax'

const DEFAULT_START_OPTIONS = {
    save_prediction: true,
    detect_anomalies: true,
}

export const getModels = () => {
    return AJAX({
        url: '/loudml/api/models',
        excludeBasepath: true,
    })
}

export const getJobs = () => {
    return AJAX({
        url: '/loudml/api/jobs',
        excludeBasepath: true,
    })
}

export const getJob = id => {
    return AJAX({
        url: `/loudml/api/jobs/${id}`,
        excludeBasepath: true,
    })
}

export const getModel = async name => {
    try {
        return await AJAX({
            url: `/loudml/api/models/${name}`,
            excludeBasepath: true,
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const createModel = model => {
    return AJAX({
        url: '/loudml/api/models',
        excludeBasepath: true,
        method: 'PUT',
        data: model,
    })
}

export const updateModel = model => {
    return AJAX({
        url: `/loudml/api/models/${model.name}`,
        excludeBasepath: true,
        method: 'POST',
        data: model,
    })
}

export const deleteModel = name => {
    return AJAX({
        url: `/loudml/api/models/${name}`,
        excludeBasepath: true,
        method: 'DELETE',
    })
}

export const getDatasources = async () => {
    try {
        return await AJAX({
            url: '/loudml/api/datasources',
            excludeBasepath: true,
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}

export const trainModel = (name, from, to) => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/models/${name}/_train`,
        params: {from, to},
        excludeBasepath: true,
    })
}

export const trainAndStartModel = (name, from, to) => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/models/${name}/_train`,
        params: {
            from,
            to,
            autostart: true,
            ...DEFAULT_START_OPTIONS,
        },
        excludeBasepath: true,
    })
}

export const forecastModel = (name, from, to) => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/models/${name}/_forecast`,
        params: {
            from,
            to,
            save_prediction: true,
            bg: true,
        },
        excludeBasepath: true,
    })
}

export const startModel = name => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/models/${name}/_start`,
        params: {
            ...DEFAULT_START_OPTIONS,
        },
        excludeBasepath: true,
    })
}

export const stopModel = name => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/models/${name}/_stop`,
        excludeBasepath: true,
    })
}

export const stopJob = id => {
    return AJAX({
        method: 'POST',
        url: `/loudml/api/jobs/${id}/_cancel`,
        excludeBasepath: true,
    })
}

export const getModelHooks = name => {
    return AJAX({
        url: `/loudml/api/models/${name}/hooks`,
        excludeBasepath: true,
    })
}

export const createModelHook = (name, hook) => {
    return AJAX({
        method: 'PUT',
        url: `/loudml/api/models/${name}/hooks`,
        data: hook,
        excludeBasepath: true,
    })
}

export const deleteModelHook = (name, hookName) => {
    return AJAX({
        method: 'DELETE',
        url: `/loudml/api/models/${name}/hooks/${hookName}`,
        excludeBasepath: true,
    })
}
