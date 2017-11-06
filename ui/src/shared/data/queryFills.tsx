export default [
  {type: 'null', text: 'null', menuOption: '(null)', inputValue: 'null', isValidForKapaNodes: true},
  {type: 'previous', text: 'previous', menuOption: '(previous)', inputValue: 'previous', isValidForKapaNodes: false},
  {type: 'number', text: 'number', menuOption: '(number)', inputValue: '0', isValidForKapaNodes: true},
  {type: 'none', text: 'none', menuOption: '(none)', inputValue: 'none', isValidForKapaNodes: true},
  {type: 'linear', text: 'linear', menuOption: '(linear)', inputValue: 'linear', isValidForKapaNodes: false},
]
// for if/when filtering FillQuery queryFill types not supported as Kapacitor nodes:
// queryFills.filter(fill => !(isKapacitorRule && !fill.isValidForKapaNodes))
