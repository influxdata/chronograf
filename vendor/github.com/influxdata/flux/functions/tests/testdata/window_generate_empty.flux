t_window_generate_empty = (table=<-) =>
  table
	|> range(start:2018-05-22T19:53:26Z, stop: 2018-05-22T19:55:00Z)
	|> window(every: 30s, createEmpty: true)

testingTest(name: "window_generate_empty", load: testLoadData, infile: "window_generate_empty.in.csv", outfile: "window_generate_empty.out.csv", test: t_window_generate_empty)