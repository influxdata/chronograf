t_derivative = (table=<-) =>
  table
  |> range(start: 2018-05-22T19:53:26Z)
  |> derivative(unit:100ms)

testingTest(name: "derivative", load: testLoadData, infile: "derivative.in.csv", outfile: "derivative.out.csv", test: t_derivative)
