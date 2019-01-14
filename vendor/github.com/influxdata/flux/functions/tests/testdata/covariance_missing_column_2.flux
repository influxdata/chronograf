covariance_missing_column_2 = (table=<-) =>
  table
	|> range(start: 2018-05-22T19:53:26Z)
  |> covariance(columns: ["x", "y"])
	|> yield(name: "0")


testingTest(name: "covariance_missing_column_2", load: testLoadData, infile: "covariance_missing_column_2.in.csv", outfile: "covariance_missing_column_2.out.csv", test: covariance_missing_column_2)
