import React from 'react'
import {mount} from 'enzyme'

import AnnotationEditorForm from 'src/shared/components/AnnotationEditorForm'
import AnnotationTagEditorLi from 'src/shared/components/AnnotationTagEditorLi'

const setup = () => {
  const mockOnSetDraftAnnotation = jest.fn()

  const getDraftAnnotation = () => {
    const calls = mockOnSetDraftAnnotation.mock.calls

    return calls[calls.length - 1][0]
  }

  const mockDebouncer = {
    call(f) {
      f()
    },
    cancel() {},
    cancelAll() {},
  }

  const props = {
    annotation: {
      id: '0',
      startTime: 1533665166679,
      endTime: 1533665166679,
      text: 'Name Me',
      tags: {foo: 'bar'},
      links: {self: '/chronograf/v1/sources/1/annotations/0'},
    },
    debouncer: mockDebouncer,
    onSetDraftAnnotation: mockOnSetDraftAnnotation,
    onDelete: () => Promise.resolve(),
  }

  const wrapper = mount(<AnnotationEditorForm {...props} />)

  return {getDraftAnnotation, wrapper}
}

describe('AnnotationEditorForm', () => {
  describe('should be able to edit annotations fields with validation', () => {
    test('name', () => {
      const {wrapper, getDraftAnnotation} = setup()

      wrapper
        .find('[data-test="name-group"] input')
        .simulate('change', {target: {value: ''}})

      let nameError = wrapper.find('[data-test="name-group"] .error')

      expect(nameError.text()).toEqual('Name cannot be empty')
      expect(getDraftAnnotation()).toEqual(null)

      wrapper
        .find('[data-test="name-group"] input')
        .simulate('change', {target: {value: 'not empty'}})

      nameError = wrapper.find('[data-test="name-group"] .error')

      expect(nameError).toHaveLength(0)

      expect(getDraftAnnotation().text).toEqual('not empty')
    })

    test('time', () => {
      const {wrapper, getDraftAnnotation} = setup()

      wrapper
        .find('[data-test="time-group"] input')
        .simulate('change', {target: {value: 'howdy'}})

      let timeError = wrapper.find('[data-test="time-group"] .error')

      expect(timeError.text()).toEqual('Not a valid date')
      expect(getDraftAnnotation()).toEqual(null)

      wrapper
        .find('[data-test="time-group"] input')
        .simulate('change', {target: {value: '2007-01-01 00:00:00Z'}})

      timeError = wrapper.find('[data-test="time-group"] .error')

      expect(timeError).toHaveLength(0)

      expect(getDraftAnnotation().startTime).toEqual(1167609600000)

      wrapper.find('[data-test="time-group"] input').simulate('blur')
    })

    test('tags', async () => {
      const {wrapper, getDraftAnnotation} = setup()

      wrapper.find('.annotation-tag-editor--add').simulate('click')

      const fillAnnotationTagInput = (rowIndex, inputIndex, text) => {
        wrapper
          .find(AnnotationTagEditorLi)
          .at(rowIndex)
          .find('input')
          .at(inputIndex)
          .simulate('change', {target: {value: text}})
      }

      fillAnnotationTagInput(1, 0, 'a')
      fillAnnotationTagInput(1, 1, 'b')

      expect(getDraftAnnotation().tags).toEqual({foo: 'bar', a: 'b'})

      wrapper.find('.annotation-tag-editor--add').simulate('click')

      fillAnnotationTagInput(2, 0, 'foo')

      let tagsError = wrapper.find('[data-test="tags-group"] .error')

      expect(tagsError.text()).toEqual('Tag keys must be unique')
      expect(getDraftAnnotation()).toEqual(null)

      wrapper.find(AnnotationTagEditorLi).at(2).find('button').simulate('click')

      tagsError = wrapper.find('[data-test="tags-group"] .error')

      expect(tagsError).toHaveLength(0)
      expect(getDraftAnnotation().tags).toEqual({foo: 'bar', a: 'b'})
    })
  })
})
