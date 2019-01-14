drop_unused = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> drop(columns: ["_measurement"])
	|> filter(fn: (r) => r._field == "usage_guest")

testingTest(name: "drop_unused", load: testLoadData, infile: "drop_unused.in.csv", outfile: "drop_unused.out.csv", test: drop_unused)
