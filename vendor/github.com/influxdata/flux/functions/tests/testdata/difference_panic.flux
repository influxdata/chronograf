t_difference_panic = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> filter(fn: (r) => r._field == "no_exist")
    |> difference()



testingTest(name: "difference_panic", load: testLoadData, infile: "difference_panic.in.csv", outfile: "difference_panic.out.csv", test: t_difference_panic)