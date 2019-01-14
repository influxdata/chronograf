t_keep_fn = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
	|> keep(fn: (column) => column == "_field" or column == "_value")
    |> keep(fn: (column) =>  {return column == "_value"})

testingTest(name: "keep_fn", load: testLoadData, infile: "keep_fn.in.csv", outfile: "keep_fn.out.csv", test: t_keep_fn)