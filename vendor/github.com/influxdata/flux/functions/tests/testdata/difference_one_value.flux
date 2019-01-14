difference_one_value = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> difference(nonNegative:true)

testingTest(name: "difference_one_value", load: testLoadData, infile: "difference_one_value.in.csv", outfile: "difference_one_value.out.csv", test: difference_one_value)
