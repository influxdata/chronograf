t_filter_by_regex = (table=<-) =>
table
  |> range(start: 2018-05-20T19:53:26Z)
  |> filter(fn: (r) => r["name"] =~ /.*0/)
  |> group(columns: ["_measurement", "_start"])
  |> map(fn: (r) => ({_time: r._time, io_time: r._value}))
  |> yield(name:"0")
testingTest(name: "filter_by_regex", load: testLoadData, infile: "filter_by_regex.in.csv", outfile: "filter_by_regex.out.csv", test: t_filter_by_regex)
