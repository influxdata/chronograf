filterRegex = /inodes*/

t_parse_regex = (table=<-) =>
  table

    |> range(start:2018-05-20T19:53:26Z)
    |> filter(fn: (r) => r._field =~ filterRegex)
    |> max()
testingTest(name: "parse_regex", load: testLoadData, infile: "parse_regex.in.csv", outfile: "parse_regex.out.csv", test: t_parse_regex)