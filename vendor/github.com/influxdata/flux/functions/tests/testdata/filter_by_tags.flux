t_filter_by_tags = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> filter(fn: (r) => r["name"] == "disk0")
  |> group(columns: ["_measurement"])
  |> map(fn: (r) => ({_time: r._time, io_time: r._value}))
  |> yield(name:"0")

testingTest(name: "filter_by_tags", load: testLoadData, infile: "filter_by_tags.in.csv", outfile: "filter_by_tags.out.csv", test: t_filter_by_tags)