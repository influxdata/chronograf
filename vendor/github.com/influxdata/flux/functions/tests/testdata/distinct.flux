t_distinct = (table=<-) =>
  table
  |> range(start: 2018-05-20T19:53:26Z)
  |> distinct(column:"_value")
  |> yield(name:"0")

testingTest(name: "distinct", load: testLoadData, infile: "distinct.in.csv", outfile: "distinct.out.csv", test: t_distinct)
