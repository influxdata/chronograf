derivative_nonnegative = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> derivative(unit:100ms, nonNegative: true)

testingTest(name: "derivative_nonnegative", load: testLoadData, infile: "derivative_nonnegative.in.csv", outfile: "derivative_nonnegative.out.csv", test: derivative_nonnegative)
