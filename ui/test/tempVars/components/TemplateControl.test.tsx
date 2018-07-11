import React from 'react'
import {shallow} from 'enzyme'

import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import TemplateVariableEditor from 'src/tempVars/components/TemplateVariableEditor'
import TemplateControl from 'src/tempVars/components/TemplateControl'
import TextTemplateSelector from 'src/tempVars/components/TextTemplateSelector'
import TemplateDropdown from 'src/tempVars/components/TemplateDropdown'
import {source} from 'test/resources'

import {TemplateType, TemplateValueType} from 'src/types'

const defaultTemplate = () => ({
  id: '0',
  tempVar: ':my-var:',
  label: '',
  type: TemplateType.Databases,
  values: [
    {
      value: 'db0',
      type: TemplateValueType.Database,
      selected: true,
      localSelected: true,
    },
  ],
})

const defaultProps = ({template = defaultTemplate()} = {}) => ({
  template,
  templates: [template],
  meRole: 'EDITOR',
  isUsingAuth: true,
  source,
  onPickValue: () => Promise.resolve(),
  onCreateTemplate: () => Promise.resolve(),
  onUpdateTemplate: () => Promise.resolve(),
  onDeleteTemplate: () => Promise.resolve(),
})

describe('TemplateControl', () => {
  it('should show a TemplateVariableEditor overlay when the settings icon is clicked', () => {
    const wrapper = shallow(<TemplateControl {...defaultProps()} />, {
      context: {
        store: {},
      },
    })

    const children = wrapper
      .find(OverlayTechnology)
      .dive()
      .find("[data-test='overlay-children']")
      .children()

    expect(children).toHaveLength(0)

    wrapper.find("[data-test='edit']").simulate('click')

    const elements = wrapper
      .find(OverlayTechnology)
      .dive()
      .find(TemplateVariableEditor)

    expect(elements).toHaveLength(1)
  })

  it('displays a TextTemplateSelector for text templates', () => {
    const props = defaultProps({
      template: {
        id: '0',
        tempVar: ':my-var:',
        label: '',
        type: TemplateType.Text,
        values: [
          {
            value: 'initial value',
            type: TemplateValueType.Constant,
            selected: true,
            localSelected: true,
          },
        ],
      },
    })

    const wrapper = shallow(<TemplateControl {...props} />)

    expect(wrapper.find(TemplateDropdown).length).toEqual(0)
    expect(wrapper.find(TextTemplateSelector).length).toEqual(1)
  })

  it('displays a TemplateDropdown for non-text templates', () => {
    const props = defaultProps({
      template: {
        id: '0',
        tempVar: ':my-var:',
        label: '',
        type: TemplateType.CSV,
        values: [],
      },
    })

    const wrapper = shallow(<TemplateControl {...props} />)

    expect(wrapper.find(TemplateDropdown).length).toEqual(1)
    expect(wrapper.find(TextTemplateSelector).length).toEqual(0)
  })
})
