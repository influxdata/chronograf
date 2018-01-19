import reducer from 'shared/reducers/comments'

import {
  deleteComment,
  loadComments,
  updateComment,
} from 'shared/actions/comments'

const a1 = {
  id: '1',
  group: '',
  name: 'anno1',
  time: '1515716169000',
  duration: '',
  text: 'you have no swoggels',
}

const a2 = {
  id: '2',
  group: '',
  name: 'anno1',
  time: '1515716169000',
  duration: '',
  text: 'you have no swoggels',
}

describe.only('Shared.Reducers.comments', () => {
  it('can load the comments', () => {
    const state = []
    const expected = [{time: '0', duration: ''}]
    const actual = reducer(state, loadComments(expected))

    expect(actual).to.deep.equal(expected)
  })

  it('can update an comment', () => {
    const state = [a1]
    const expected = [{...a1, time: ''}]
    const actual = reducer(state, updateComment(expected[0]))

    expect(actual).to.deep.equal(expected)
  })

  it('can delete an comment', () => {
    const state = [a1, a2]
    const expected = [a2]
    const actual = reducer(state, deleteComment(a1))

    expect(actual).to.deep.equal(expected)
  })
})
