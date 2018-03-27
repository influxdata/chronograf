import moment from 'moment'

export const normalizeInterval = bucketInterval => {
    const regex = /(\d+)(.*)/
    const interval = regex.exec(bucketInterval)
    const duration = moment.duration(Number.parseInt(interval[1], 10), interval[2]).asSeconds()
    const normalized = Math.max(
        5,
        moment.duration(
            Math.min(
                duration,
                60
            ),
            's'
        ).asSeconds()
    )
    return `${normalized}s`
}

export const normalizeFeatureDefault = fill => {
    if (fill==='none'||fill==='null') {
        fill = null
    }
    // try to parse number
    const parsed = Number.parseFloat(fill)
    if (Number.isNaN(parsed)) {
        return fill
    }
    return parsed
}

export const denormalizeFeatureDefault = fill => {
    if (fill==='previous') {
        return fill
    }

    return `${fill}`
}
