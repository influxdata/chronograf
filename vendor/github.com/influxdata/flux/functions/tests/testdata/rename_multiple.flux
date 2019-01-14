t_rename_multiple = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> rename(columns: {old:"new"})
	|> rename(columns: {new: "new1"})

testingTest(name: "rename_multiple", load: testLoadData, infile: "rename_multiple.in.csv", outfile: "rename_multiple.out.csv", test: t_rename_multiple)