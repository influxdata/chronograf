option now = () => 2018-12-19T22:15:00Z

t_set_new_column = (table=<-) => table
  |> range(start: -5m)
  |> set(key: "t1", value: "server01")

testingTest(name: "set_new_column", load: testLoadData, infile: "set_new_column.in.csv", outfile: "set_new_column.out.csv", test: t_set_new_column)
