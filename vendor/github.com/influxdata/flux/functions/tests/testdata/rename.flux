t_rename = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z)
	|> rename(columns:{host:"server"})
	|> drop(columns:["_start", "_stop"])


testingTest(name: "rename", load: testLoadData, infile: "rename.in.csv", outfile: "rename.out.csv", test: t_rename)