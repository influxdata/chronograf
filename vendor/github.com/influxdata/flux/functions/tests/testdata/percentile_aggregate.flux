option now = () => 2018-12-18T21:14:00Z

t_percentile = (table=<-) => table
    |> range(start: -2m)
    |> percentile(percentile: 0.75, method: "exact_mean")

testingTest(name: "percentile_aggregate", load: testLoadData, infile: "percentile_aggregate.in.csv", outfile: "percentile_aggregate.out.csv", test: t_percentile)
