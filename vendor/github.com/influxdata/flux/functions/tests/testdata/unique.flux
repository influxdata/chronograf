t_unique = (table=<-) =>
  table
  |> unique(column: "tag0")

testingTest(name: "unique", load: testLoadData, infile: "unique.in.csv", outfile: "unique.out.csv", test: t_unique)