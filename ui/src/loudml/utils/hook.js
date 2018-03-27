export const createHook = (hook, datasource) => {
    const h = {...hook}
    h.config.datasource = datasource
    return h
}
