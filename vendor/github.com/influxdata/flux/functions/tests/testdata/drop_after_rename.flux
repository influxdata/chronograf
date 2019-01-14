drop_after_rename = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
	|> rename(columns: {old: "new"})
	|> drop(columns: ["old"])

testingTest(name: "drop_after_rename", load: testLoadData, infile: "drop_after_rename.in.csv", outfile: "drop_after_rename.out.csv", test: drop_after_rename)
