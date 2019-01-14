t_null_as_value = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
	|> filter(fn: (r) => r._value == null)

testingTest(name: "null_as_value", load: testLoadData, infile: "null_as_value.in.csv", outfile: "null_as_value.out.csv", test: t_null_as_value)