regexFunc = (table=<-, regLiteral) =>
   table
     |>  range(start:2018-05-20T19:53:26Z)
     |>  filter(fn: (r) => r._field =~ regLiteral)
     |>  max()


t_filter_by_regex_function = (table=<-) =>
  table
  |> regexFunc(regLiteral: /io.*/)
testingTest(name: "filter_by_regex_function", load: testLoadData, infile: "filter_by_regex_function.in.csv", outfile: "filter_by_regex_function.out.csv", test: t_filter_by_regex_function)

