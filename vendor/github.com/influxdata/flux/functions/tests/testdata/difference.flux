t_difference = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> difference()

testingTest(name: "difference", load: testLoadData, infile: "difference.in.csv", outfile: "difference.out.csv", test: t_difference)
