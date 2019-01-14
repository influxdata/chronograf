drop_referenced = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> drop(columns: ["_field"])
	|> filter(fn: (r) => r._field == "usage_guest")

testingTest(name: "drop_referenced", load: testLoadData, infile: "drop_referenced.in.csv", outfile: "drop_referenced.out.csv", test: drop_referenced)
