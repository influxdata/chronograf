covariance_missing_column_1 = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
    |> covariance(columns: ["x", "r"])
	|> yield(name: "0")


testingTest(name: "covariance_missing_column_1", load: testLoadData, infile: "covariance_missing_column_1.in.csv", outfile: "covariance_missing_column_1.out.csv", test: covariance_missing_column_1)
