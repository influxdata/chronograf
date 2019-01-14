t_cumulative_sum = (table=<-) => table
  |> cumulativeSum(columns: ["v0", "v1"])

testingTest(
    name: "cumulative_sum", 
    load: testLoadData,
    infile: "cumulative_sum.in.csv",
    outfile: "cumulative_sum.out.csv", 
    test: t_cumulative_sum
)