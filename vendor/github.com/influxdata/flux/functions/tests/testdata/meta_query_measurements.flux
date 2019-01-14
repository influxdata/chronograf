t_meta_query_measurements = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> group(columns: ["_measurement"])
    |> distinct(column: "_measurement")
    |> group()
testingTest(name: "meta_query_measurements", load: testLoadData, infile: "meta_query_measurements.in.csv", outfile: "meta_query_measurements.out.csv", test: t_meta_query_measurements)