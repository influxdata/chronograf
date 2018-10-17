import React from 'react'
import DatasourceSection from 'src/loudml/components/DatasourceSection'
import { Dropdown } from 'src/shared/components/Dropdown';

import {mount} from 'enzyme'

// mock props
const sourceOne = {
    name: 'foo',
}
const sourceTwo = {
    name: 'bar',
}

const datasources = [sourceOne, sourceTwo]

// automate shallow render and providing new props
const setup = (override = {}) => {
    const props = {
        name: 'myprop',
        datasources,
        onChoose: () => {},
        disabled: false,
        ...override,
    }

    const wrapper = mount(<DatasourceSection {...props} />)

    return {
        props,
        wrapper,
    }
}

describe('Components.Loudml.DatasourceSection', () => {
    describe('rendering', () => {
        describe('initial render', () => {
            it('renders the <DatasourceSection/> component', () => {
                const {wrapper} = setup()

                expect(wrapper.exists()).toBe(true)
            })

            it('renders the <Dropdown/> button', () => {
                const {wrapper} = setup()

                const menu = wrapper.find(Dropdown)
                expect(menu.exists()).toBe(true)
            })

            it('does not show the list if empty datasources', () => {
                const {wrapper} = setup({datasources: null})

                const menu = wrapper.find(Dropdown)
                expect(menu.exists()).toBe(false)
                expect(wrapper.text()).toBe('No datasources')
            })
        })
    })

    describe('user interactions', () => {
        describe('handleSelection', () => {
            it('it calls onChoose with name and item provided', () => {
                const onChoose = jest.fn()
                const {wrapper} = setup({onChoose})
      
                const dropdown = wrapper.find(Dropdown)
                dropdown.find({'data-test': 'dropdown-toggle'}).simulate('click')
                const menu = wrapper.find('a').filterWhere(n => n.text() === sourceOne.name)
                menu.simulate('click')
                
                expect(onChoose).toHaveBeenCalledTimes(1)
                expect(onChoose).toHaveBeenCalledWith('myprop', sourceOne.name)
            })
        })      
    })
})
