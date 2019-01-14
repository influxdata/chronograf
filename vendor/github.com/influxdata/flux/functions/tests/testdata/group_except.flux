t_group_except = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> group(columns:["_measurement", "_time", "_value"], mode: "except")
    |> max()

testingTest(name: "group_except", load: testLoadData, infile: "group_except.in.csv", outfile: "group_except.out.csv", test: t_group_except)