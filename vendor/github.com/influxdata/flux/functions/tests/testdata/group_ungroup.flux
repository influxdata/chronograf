t_group_ungroup = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> group(columns: ["name"])
  |> group()
  |> map(fn: (r) => ({_time: r._time, io_time:r._value}))
  |> yield(name:"0")

testingTest(name: "group_ungroup", load: testLoadData, infile: "group_ungroup.in.csv", outfile: "group_ungroup.out.csv", test: t_group_ungroup)