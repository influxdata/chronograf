option now = () => 2018-12-18T21:14:00Z

t_percentile = (table=<-) => table
    |> range(start: -2m)
    |> percentile(percentile: 0.75, method: "estimate_tdigest")

testingTest(name: "percentile_tdigest", load: testLoadData, infile: "percentile_tdigest.in.csv", outfile: "percentile_tdigest.out.csv", test: t_percentile)
