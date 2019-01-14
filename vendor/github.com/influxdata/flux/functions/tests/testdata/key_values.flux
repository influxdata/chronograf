t_key_values = (table=<-) =>
  table
  |> keyValues(keyColumns: ["_value"])
testingTest(
    name: "key_values",
    load: testLoadData,
    infile: "key_values.in.csv",
    outfile: "key_values.out.csv",
    test: t_key_values,
)