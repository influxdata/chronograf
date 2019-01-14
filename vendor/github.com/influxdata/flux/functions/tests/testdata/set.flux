option now = () => 2018-12-19T22:15:00Z

t_set = (table=<-) => table
  |> range(start: -5m)
  |> set(key: "t0", value: "server01")

testingTest(name: "set", load: testLoadData, infile: "set.in.csv", outfile: "set.out.csv", test: t_set)
