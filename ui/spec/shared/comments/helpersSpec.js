import {getComments} from 'shared/comments/helpers'
import Dygraph from 'src/external/dygraph'

const start = 1515628800000
const end = 1516060800000
const timeSeries = [
  [start, 25],
  [1515715200000, 13],
  [1515801600000, 10],
  [1515888000000, 5],
  [1515974400000, null],
  [end, 14],
]

const labels = ['time', 'test.label']

const div = document.createElement('div')
const graph = new Dygraph(div, timeSeries, {labels})

const a1 = {
  group: '',
  name: 'a1',
  time: '1515716160000',
  duration: '',
  text: 'you have no swoggels',
}

const a2 = {
  group: '',
  name: 'a2',
  time: '1515716169000',
  duration: '3600000', // 1 hour
  text: 'you have no swoggels',
}

const comments = [a1]

describe('Shared.Comments.Helpers', () => {
  describe('getComments', () => {
    it('returns an empty array with no graph or comments are provided', () => {
      const actual = getComments(undefined, comments)
      const expected = []

      expect(actual).to.deep.equal(expected)
    })

    it('returns an comment if it is in the time range', () => {
      const actual = getComments(graph, comments)
      const expected = comments

      expect(actual).to.deep.equal(expected)
    })

    it('removes an comment if it is out of the time range', () => {
      const outOfBounds = {
        group: '',
        name: 'not in time range',
        time: '2515716169000',
        duration: '',
      }

      const newAnnos = [...comments, outOfBounds]
      const actual = getComments(graph, newAnnos)
      const expected = comments

      expect(actual).to.deep.equal(expected)
    })

    describe('with a duration', () => {
      it('it adds an comment', () => {
        const withDurations = [...comments, a2]
        const actual = getComments(graph, withDurations)
        const expectedComment = {
          ...a2,
          time: `${Number(a2.time) + Number(a2.duration)}`,
          duration: '',
        }

        const expected = [...withDurations, expectedComment]
        expect(actual).to.deep.equal(expected)
      })

      it('does not add a duration comment if it is out of bounds', () => {
        const commentWithOutOfBoundsDuration = {
          ...a2,
          duration: a2.time,
        }

        const withDurations = [
          ...comments,
          commentWithOutOfBoundsDuration,
        ]

        const actual = getComments(graph, withDurations)
        const expected = withDurations

        expect(actual).to.deep.equal(expected)
      })
    })
  })
})
