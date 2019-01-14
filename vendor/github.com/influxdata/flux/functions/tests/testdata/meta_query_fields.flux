t_meta_query_fields = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> filter(fn: (r) => r._measurement == "cpu")
    |> group(columns: ["_field"])
    |> distinct(column: "_field")
    |> group()
testingTest(name: "meta_query_fields", load: testLoadData, infile: "meta_query_fields.in.csv", outfile: "meta_query_fields.out.csv", test: t_meta_query_fields)