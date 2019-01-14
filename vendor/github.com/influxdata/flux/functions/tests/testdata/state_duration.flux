t_state_duration = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> stateDuration(fn:(r) => r._value > 80)

testingTest(name: "state_duration", load: testLoadData, infile: "state_duration.in.csv", outfile: "state_duration.out.csv", test: t_state_duration)