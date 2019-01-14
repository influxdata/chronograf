t_histogram = (table=<-) =>
  table
    |> histogram(bins:[-1.0,0.0,1.0,2.0],
           normalize:true,
           column: "theValue",
           countColumn: "theCount",
           upperBoundColumn: "ub")

testingTest(name: "histogram", load: testLoadData, infile: "histogram_normalize.in.csv", outfile: "histogram_normalize.out.csv", test: t_histogram)