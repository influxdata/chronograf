n = 1
fieldSelect = "field{n}"

t_string_interp = (table=<-) =>
  table
    |> range(start:2018-05-22T19:53:26Z)
    |> filter(fn: (r) => r._field == fieldSelect)
testingTest(name: "string_interp", load: testLoadData, infile: "string_interp.in.csv", outfile: "string_interp.out.csv", test: t_string_interp)