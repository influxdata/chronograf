t_meta_query_keys = (table=<-) => {
  zero = table
    |> range(start:2018-05-22T19:53:26Z)
    |> filter(fn: (r) => r._measurement == "cpu")
    |> keys()
    |> yield(name:"0")

  one = table
    |> range(start:2018-05-22T19:53:26Z)
    |> filter(fn: (r) => r._measurement == "cpu")
    |> group(columns: ["host"])
    |> distinct(column: "host")
    |> group()
    |> yield(name:"1")
  return union(tables: [zero, one])
}
testingTest(name: "meta_query_keys", load: testLoadData, infile: "meta_query_keys.in.csv", outfile: "meta_query_keys.out.csv", test: t_meta_query_keys)