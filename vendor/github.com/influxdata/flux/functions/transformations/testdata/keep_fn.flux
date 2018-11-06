from(bucket: "test")
	|> range(start: 2018-05-22T19:53:26Z)
	|> keep(fn: (column) => column == "_field" or column == "_value")
    |> keep(fn: (column) =>  {return column == "_value"})
