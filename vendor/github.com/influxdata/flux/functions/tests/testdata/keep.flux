t_keep = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
	|> keep(columns: ["_time", "_value", "_field"])

testingTest(name: "keep", load: testLoadData, infile: "keep.in.csv", outfile: "keep.out.csv", test: t_keep)