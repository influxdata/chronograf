t_cumulative_sum_noop = (table=<-) => table
  |> cumulativeSum()

testingTest(
    name: "cumulative_sum_noop", 
    load: testLoadData,
    infile: "cumulative_sum_noop.in.csv",
    outfile: "cumulative_sum_noop.out.csv", 
    test: t_cumulative_sum_noop
)