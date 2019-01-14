t_rename_fn = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> rename(fn: (column) => column)
	|> drop(fn: (column) => column == "_start" or column == "_stop")

testingTest(name: "rename_fn", load: testLoadData, infile: "rename_fn.in.csv", outfile: "rename_fn.out.csv", test: t_rename_fn)