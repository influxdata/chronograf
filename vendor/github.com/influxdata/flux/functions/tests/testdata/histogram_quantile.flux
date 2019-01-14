t_histogram_quantile = (table=<-) =>
  table
    |> range(start: 2018-05-22T19:53:00Z)
    |> histogramQuantile(quantile:0.90,upperBoundColumn:"le")

testingTest(name: "histogram_quantile", load: testLoadData, infile: "histogram_quantile.in.csv", outfile: "histogram_quantile.out.csv", test: t_histogram_quantile)