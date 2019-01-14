t_histogram = (table=<-) =>
  table
    |> histogram(bins:[-1.0,0.0,1.0,2.0])

testingTest(name: "histogram", load: testLoadData, infile: "histogram.in.csv", outfile: "histogram.out.csv", test: t_histogram)