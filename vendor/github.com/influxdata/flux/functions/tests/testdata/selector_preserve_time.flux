t_selector_preserve_time = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
	|> top(n:3)
	|> group(columns:["host"])

testingTest(name: "selector_preserve_time", load: testLoadData, infile: "selector_preserve_time.in.csv", outfile: "selector_preserve_time.out.csv", test: t_selector_preserve_time)