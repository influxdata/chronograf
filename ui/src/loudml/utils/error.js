import _ from 'lodash'

export const parseError = error => {
    return _.get(
        error,
        'data.message',
        _.get(
            error,
            'data.error',
            _.get(
                error,
                'data',
                error
            )
        )
    )
}

