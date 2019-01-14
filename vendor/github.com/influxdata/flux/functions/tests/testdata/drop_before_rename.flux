drop_before_rename = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
	|> drop(columns: ["old"])
	|> rename(columns: {old: "new"})
	|> yield(name: "0")


testingTest(name: "drop_before_rename", load: testLoadData, infile: "drop_before_rename.in.csv", outfile: "drop_before_rename.out.csv", test: drop_before_rename)
