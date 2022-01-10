import changeTaskName from 'src/kapacitor/utils/changeTaskName'

describe('kapacitor.utils.changeTaskName', () => {
  ;[
    {
      id: 'inserts into empty tickscript',
      existing: '',
      name: 'my name',
      result: "var name = 'my name'\n",
    },
    {
      id: 'inserts into tickscript without var',
      existing: 'var whatever = TRUE\n',
      name: 'my name',
      result: "var name = 'my name'\nvar whatever = TRUE\n",
    },
    {
      id: 'inserts escaped name into tickscript without var',
      existing: 'var whatever = TRUE\n',
      name: "my\\'name",
      result: "var name = 'my\\\\\\'name'\nvar whatever = TRUE\n",
    },
    {
      id: 'replaces leading variable definition',
      existing: "var name='otherName'\r\nWHATEVERHEREIN",
      name: 'my name',
      result: "var name = 'my name'\nWHATEVERHEREIN",
    },
    {
      id: 'replaces inline variable definition',
      existing: "WHATEVERBEFORE\r\nvar name='otherName'\nWHATEVERAFTER",
      name: 'my name',
      result: "WHATEVERBEFORE\r\nvar name = 'my name'\nWHATEVERAFTER",
    },
    {
      id: 'replaces escaped variable definition',
      existing:
        "WHATEVERBEFORE\nvar \tname \t= \t'otherName'\t \nWHATEVERAFTER",
      name: "my\\'name",
      result: "WHATEVERBEFORE\nvar name = 'my\\\\\\'name'\nWHATEVERAFTER",
    },
  ].forEach(test => {
    it(test.id, () => {
      expect(changeTaskName(test.existing, test.name)).toBe(test.result)
    })
  })
})
