import React from 'react'
import {mount} from 'enzyme'

import AnnotationEditor from 'src/shared/components/AnnotationEditor'

const generateProps = () => ({
  annotation: {
    id: '0',
    startTime: 1533665166679,
    endTime: 1533665166679,
    text: 'Name Me',
    tags: {foo: 'bar'},
    links: {self: '/chronograf/v1/sources/1/annotations/0'},
  },
  onCancel: () => {},
  onSave: jest.fn(),
  onDelete: () => Promise.resolve(),
})

describe('AnnotationEditor', () => {
  test('does not allow saving when form fields are invalid', () => {
    const wrapper = mount(<AnnotationEditor {...generateProps()} />)

    const saveDisabled = () =>
      wrapper.find('[data-test="save-button"]').prop('disabled')

    const fillNameInput = text =>
      wrapper
        .find('[data-test="name-group"] input')
        .simulate('change', {target: {value: text}})

    // Disabled since no edits have been made
    expect(saveDisabled()).toBe(true)

    // Not disabled since valid edits have been made
    fillNameInput('not empty')
    expect(saveDisabled()).toBe(false)

    // Disabled since invalid edits have been made
    fillNameInput('')
    expect(saveDisabled()).toBe(true)
  })

  test('saves with new annotation after clicking save button', () => {
    const props = generateProps()
    const wrapper = mount(<AnnotationEditor {...props} />)

    wrapper
      .find('[data-test="name-group"] input')
      .simulate('change', {target: {value: 'howdy'}})

    wrapper.find('[data-test="save-button"]').simulate('click')

    expect(props.onSave).toHaveBeenCalled()
  })
})
