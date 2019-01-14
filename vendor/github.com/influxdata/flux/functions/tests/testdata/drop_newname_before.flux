drop_newname_before = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> drop(columns:["new"])
	|> rename(columns: {old:"new"})

testingTest(name: "drop_newname_before", load: testLoadData, infile: "drop_newname_before.in.csv", outfile: "drop_newname_before.out.csv", test: drop_newname_before)
