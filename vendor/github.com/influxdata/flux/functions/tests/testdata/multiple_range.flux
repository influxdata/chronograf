t_multiple_range = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z, stop: 2018-05-22T19:54:16Z)
	|> range(start: 2018-05-22T19:54:06Z)

testingTest(name: "multiple_range", load: testLoadData, infile: "multiple_range.in.csv", outfile: "multiple_range.out.csv", test: t_multiple_range)