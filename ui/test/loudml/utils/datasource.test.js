import {findSource} from 'src/loudml/utils/datasource'
const SOURCES = [
    {
        "url":"http://localhost:8086",
    },
    {
        "url":"localhost:32768",
    },
]

const DATASOURCES_PARTIAL_MATCH = [
    {
        addr: "localhost:8086",
    },
    {
        addr: "http://localhost:32768",
    },
]

const DATASOURCES_FULL_MATCH = [
    {
        addr: "http://localhost:8086",
    },
    {
        addr: "localhost:32768",
    },
]

const UNKNOWN_DATASOURCE_IMPLICIT_PROTOCOL = {
    addr: "localhost:99",
}

const UNKNOWN_DATASOURCE_EXPLICIT_PROTOCOL = {
    addr: "http://localhost:99",
}

const DATASOURCES_NO_MATCH = [
    {
        addr: "localhost:80",
    },
    {
        addr: "http://localhost:3276",
    },
]

describe('Loudml.Utils.Datasource', () => {
    describe('findSource', () => {
        it('returns undefined if no explicit match', () => {
            const datasource = UNKNOWN_DATASOURCE_EXPLICIT_PROTOCOL
            const sources = SOURCES

            expect(findSource(sources, datasource)).toBeUndefined()
        })

        it('returns undefined if no implicit match', () => {
            const datasource = UNKNOWN_DATASOURCE_IMPLICIT_PROTOCOL
            const sources = SOURCES

            expect(findSource(sources, datasource)).toBeUndefined()
        })

        it('returns undefined if no match', () => {
            const datasources = DATASOURCES_NO_MATCH
            const sources = SOURCES

            datasources.forEach(datasource => {
                expect(findSource(sources, datasource)).toBeUndefined()
            });
        })

        it('returns source if partial match', () => {
            const datasources = DATASOURCES_PARTIAL_MATCH
            const sources = SOURCES

            datasources.forEach((datasource, index) => {
                expect(findSource(sources, datasource)).toEqual(SOURCES[index])
            });
        })

        it('returns source if full match', () => {
            const datasources = DATASOURCES_FULL_MATCH
            const sources = SOURCES

            datasources.forEach((datasource, index) => {
                expect(findSource(sources, datasource)).toEqual(SOURCES[index])
            });
        })
    })

})
