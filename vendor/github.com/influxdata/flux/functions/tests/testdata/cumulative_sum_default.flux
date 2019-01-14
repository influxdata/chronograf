t_cumulative_sum_default = (table=<-) => table
  |> cumulativeSum()

testingTest(
    name: "cumulative_sum_default", 
    load: testLoadData,
    infile: "cumulative_sum_default.in.csv",
    outfile: "cumulative_sum_default.out.csv", 
    test: t_cumulative_sum_default
)