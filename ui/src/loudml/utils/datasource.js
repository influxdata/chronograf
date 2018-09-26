export const findSource = (sources, datasource) => {
    // remove datasource protocol
    const loudmlHosts = datasource.addr.split('://')
    const loudmlHost = loudmlHosts.slice(-1)[0]

    return sources.find(s => {
        const sourceDbs = s.url.split('://')
        return sourceDbs.slice(-1)[0] === loudmlHost
    })
}
