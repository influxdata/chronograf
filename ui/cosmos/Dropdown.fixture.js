import Dropdown from 'src/shared/components/Dropdown'

export default {
  component: Dropdown,
  props: {
    selected: 'linear',
    items: [
      {
        type: 'previous',
        text: 'previous',
        menuOption: '(previous)',
        inputValue: 'previous',
        isValidForKapaNodes: false,
      },
      {
        type: 'number',
        text: 'number',
        menuOption: '(number)',
        inputValue: '0',
        isValidForKapaNodes: true,
      },
      {
        type: 'none',
        text: 'none',
        menuOption: '(none)',
        inputValue: 'none',
        isValidForKapaNodes: true,
      },
      {
        type: 'linear',
        text: 'linear',
        menuOption: '(linear)',
        inputValue: 'linear',
        isValidForKapaNodes: false,
      },
    ],
    onChoose: () => {},
    buttonSize: 'btn-sm',
    buttonColor: 'btn-info',
    menuClass: 'dropdown-plutonium',
    disabled: false,
    actions: [],
    menuWidth: '100%',
    useAutoComplete: false,
    tabIndex: 0,
  },
}
