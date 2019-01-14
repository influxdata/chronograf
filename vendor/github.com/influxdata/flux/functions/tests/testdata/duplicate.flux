t_duplicate = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> duplicate(column: "host", as: "host_new")

testingTest(name: "duplicate", load: testLoadData, infile: "duplicate.in.csv", outfile: "duplicate.out.csv", test: t_duplicate)
