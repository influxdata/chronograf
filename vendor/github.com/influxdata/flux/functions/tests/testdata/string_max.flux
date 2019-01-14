t_string_max = (table=<-) =>
  table
    |> range(start:2018-05-22T19:54:16Z)
    |> max()
testingTest(name: "string_max", load: testLoadData, infile: "string_max.in.csv", outfile: "string_max.out.csv", test: t_string_max)