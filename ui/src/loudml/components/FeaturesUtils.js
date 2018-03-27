export default class {
    static deserializeFeature(feature, direction) {
        return {
            ...feature,
            io: direction
        }
    }

    static deserializedFeatures(features) {
        return (
            Array.isArray(features) // LoudML 1.3
            ? features.map(feature => this.deserializeFeature(feature, 'io'))
            : Object.entries(features)
                .map(([key, value]) => value.map(f => this.deserializeFeature(f, key)))
                .reduce((a, f) => [...a, ...f], [])
        )
    }

    static serializedFeatures(features) {
        // serialize features Array
        return features.reduce((o, feature) => {
            const key = feature.io
            const f = o[key]||[]
            f.push(this.serializeFeature(feature))
            return {
                ...o,
                [key]: f
            }
        }, {})
    }

    static serializeFeature(feature) {
        const newFeature = {...feature}
        delete newFeature.io    // extra parameters not allowed
        return newFeature
    }

}
