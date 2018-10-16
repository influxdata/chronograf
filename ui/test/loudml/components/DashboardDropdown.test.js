import React from 'react'
import {DashboardDropdown} from 'src/loudml/components/DashboardDropdown'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {mount} from 'enzyme'

// mock props
const dashboardOne = {
    name: 'foo',
    id: '1',
}
const dashboardTwo = {
    name: 'bar',
    id: '2',
}

const dashboards = [dashboardOne, dashboardTwo]

// automate shallow render and providing new props
const setup = (override = {}) => {
    const props = {
        dashboards: [],
        model: {
            settings: {
                name: 'foo',
            },
        },
        onView: jest.fn(),
        onNew: jest.fn(),
        onAddTo: jest.fn(),
        ...override,
    }

    const defaultState = {
        isOpen: false,
    }

    const dropdown = mount(<DashboardDropdown {...props} />)

    return {
        props,
        dropdown,
        defaultState,
    }
}

describe('Components.Loudml.DashboardDropdown', () => {
    describe('rendering', () => {
        describe('initial render', () => {
            it('renders the <DashboardDropdown/> button', () => {
                const {dropdown} = setup()

                expect(dropdown.exists()).toBe(true)
            })

            it('does not show the list', () => {
                const {dropdown} = setup()

                const menu = dropdown.find(FancyScrollbar)
                expect(menu.exists()).toBe(false)
            })
        })
    })

    describe('user interactions', () => {
        describe('opening the <DashboardDropdown/>', () => {
            it('shows the menu when clicked', () => {
                const {dropdown} = setup()

                dropdown.simulate('click')

                const menu = dropdown.find(FancyScrollbar)
                expect(dropdown.state().isOpen).toBe(true)
                expect(menu.exists()).toBe(true)
            })

            it('hides the menu when clicked twice', () => {
                const {dropdown} = setup()

                // first click
                dropdown.simulate('click')
                // second click
                dropdown.simulate('click')

                const menu = dropdown.find(FancyScrollbar)
                expect(dropdown.state().isOpen).toBe(false)
                expect(menu.exists()).toBe(false)
            })
        })
    })

    describe('list content', () => {
        it('show the View action if dashboard exists', () => {
            const {dropdown} = setup({dashboards})

            dropdown.simulate('click')

            const view = dropdown.find({'data-test': 'view'})
            expect(view.exists()).toBe(true)
        })
        it('does not show the View action if dashboard does not exist', () => {
            const {dropdown} = setup()
        
            dropdown.simulate('click')
        
            const view = dropdown.find({'data-test': 'view'})
            expect(view.exists()).toBe(false)
        })
        it('show the New action if dashboard does not exist', () => {
            const {dropdown} = setup()
        
            dropdown.simulate('click')
        
            const newItem = dropdown.find({'data-test': 'new'})
            expect(newItem.exists()).toBe(true)
        })
        it('does not show the New action if dashboard exists', () => {
            const {dropdown} = setup({dashboards})
        
            dropdown.simulate('click')
        
            const newItem = dropdown.find({'data-test': 'new'})
            expect(newItem.exists()).toBe(false)
        })
        it('show the `Add to...` action if dashboards list not empty', () => {
            const {dropdown} = setup({dashboards})
        
            dropdown.simulate('click')
        
            const add = dropdown.find({'data-test': 'addTo'})
            expect(add.exists()).toBe(true)
        })
    })
    describe('list actions', () => {
        describe('View in dashboard', () => {
            it('handle action', () => {
                const onView = jest.fn()
                const {dropdown} = setup({
                    dashboards,
                    onView,
                })

                dropdown.simulate('click')
    
                const view = dropdown.find({'data-test': 'view'})
                view.find('a').simulate('click')

                expect(onView).toHaveBeenCalledTimes(1)
            })
        })
        describe('New dashboard', () => {
            it('handle action', () => {
                const onNew = jest.fn()
                const {dropdown} = setup({
                    onNew,
                })

                dropdown.simulate('click')
    
                const newItem = dropdown.find({'data-test': 'new'})
                newItem.find('a').simulate('click')

                expect(onNew).toHaveBeenCalledTimes(1)
            })
        })
        describe('Add to... dashboard', () => {
            it('handle action', () => {
                const onAddTo = jest.fn()
                const {dropdown} = setup({
                    dashboards,
                    onAddTo,
                })

                dropdown.simulate('click')
    
                const addItem = dropdown.find('li').last()
                addItem.find('a').simulate('click')

                expect(onAddTo).toHaveBeenCalledTimes(1)
            })
        })
    })
})
