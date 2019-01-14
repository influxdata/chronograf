t_string_sort = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> sort()

testingTest(name: "string_sort", load: testLoadData, infile: "string_sort.in.csv", outfile: "string_sort.out.csv", test: t_string_sort)