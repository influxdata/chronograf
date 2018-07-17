import React from 'react'
import {mount} from 'enzyme'

import AnnotationFilterControl from 'src/shared/components/AnnotationFilterControl'

import {TagFilterType} from 'src/types/annotations'

describe('AnnotationFilterControl', () => {
  test('it suggests keys', async () => {
    const props = {
      tagFilter: {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.Equals,
      },
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      onGetKeySuggestions: () =>
        Promise.resolve(['foo', 'foamy', 'foamier', 'frothy']),
      onGetValueSuggestions: jest.fn(),
    }

    const wrapper = mount(<AnnotationFilterControl {...props} />)

    // Focusing the input triggers fetching suggestions
    wrapper
      .find('.suggestion-input--input')
      .at(0)
      .simulate('focus')

    // Give component a chance to read resolved suggestion promise
    await new Promise(res => setTimeout(res, 50))

    const fillInput = text =>
      wrapper
        .find('.suggestion-input--input')
        .at(0)
        .simulate('change', {target: {value: text}})

    const getSuggestions = () =>
      wrapper.find('.suggestion-input-suggestion').map(node => node.text())

    fillInput('')
    expect(getSuggestions()).toEqual(['foamier', 'foamy', 'foo', 'frothy'])

    fillInput('fo')
    expect(getSuggestions()).toEqual(['foamier', 'foamy', 'foo'])
  })

  test('saving is disabled until making an edit', () => {
    const props = {
      tagFilter: {
        id: '0',
        tagKey: 'foo',
        tagValue: 'bar',
        filterType: TagFilterType.Equals,
      },
      onUpdate: jest.fn(),
      onDelete: jest.fn(),
      onGetKeySuggestions: () => Promise.resolve([]),
      onGetValueSuggestions: () => Promise.resolve([]),
    }

    const wrapper = mount(<AnnotationFilterControl {...props} />)

    expect(
      wrapper
        .find('button')
        .at(1)
        .find('.button-icon')
        .hasClass('trash')
    ).toBe(true)

    wrapper
      .find('.suggestion-input--input')
      .at(1)
      .simulate('focus')

    const saveButton = wrapper.find('button').at(1)

    expect(saveButton.find('.button-icon').hasClass('checkmark')).toBe(true)

    saveButton.simulate('click')

    expect(props.onUpdate).toHaveBeenCalled()
  })
})
