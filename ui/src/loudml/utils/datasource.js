export const findSource = (sources, datasource) => {
    return sources.find(s => s.url.match(new RegExp(datasource.addr)))
}
