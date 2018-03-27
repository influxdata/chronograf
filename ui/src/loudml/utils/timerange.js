
export const convertTimeRange = (timeRange) => {
    const {lower, upper} = timeRange
    const regex = /[ \(\)]/g

    return {
        lower: (lower||'now()').replace(regex, ''),
        upper: (upper||'now()').replace(regex, ''),
    }
}
