t_last = (table=<-) =>
  table
  |> last()
testingTest(name: "last", load: testLoadData, infile: "last.in.csv", outfile: "last.out.csv", test: t_last)