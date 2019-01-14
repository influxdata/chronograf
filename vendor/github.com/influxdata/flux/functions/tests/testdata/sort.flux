t_sort = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> sort(columns:["_value", "_time"])

testingTest(name: "sort", load: testLoadData, infile: "sort.in.csv", outfile: "sort.out.csv", test: t_sort)