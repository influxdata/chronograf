drop_newname_after = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
	|> rename(columns:{old:"new"})
	|> drop(columns: ["new"])

testingTest(name: "drop_newname_after", load: testLoadData, infile: "drop_newname_after.in.csv", outfile: "drop_newname_after.out.csv", test: drop_newname_after)
