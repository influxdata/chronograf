t_key_values_host_name = (table=<-) =>
  table
  |> keyValues(keyColumns: ["host", "name"])
testingTest(
    name: "key_values_host_name",
    load: testLoadData,
    infile: "key_values_host_name.in.csv",
    outfile: "key_values_host_name.out.csv",
    test: t_key_values_host_name,
)