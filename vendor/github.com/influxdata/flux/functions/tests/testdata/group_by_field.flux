t_group_by_field = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> group(columns: ["_value"])
testingTest(name: "group_by_field", load: testLoadData, infile: "group_by_field.in.csv", outfile: "group_by_field.out.csv", test: t_group_by_field)