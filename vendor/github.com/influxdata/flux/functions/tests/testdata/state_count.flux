t_state_count = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> stateCount(fn:(r) => r._value > 80)

testingTest(name: "state_count", load: testLoadData, infile: "state_count.in.csv", outfile: "state_count.out.csv", test: t_state_count)