t_yield = (table=<-) =>
  table
    |> sort()
    |> limit(n: 3)
    |> yield(name: "1: lowest 3")
    |> sample(n: 2, pos: 1)
    |> yield(name: "2: 2nd row")

indata = testLoadData(file: "yield.in.csv")
got = indata |> t_yield() |> yield(name: "5")
want = testLoadData(file: "yield.out.csv") |> yield(name:"6")
//assertEquals(name: "yield", want: want, got: got)
//testingTest(name: "yield", load: testLoadData, infile: "yield.in.csv", outfile: "yield.out.csv", test: t_yield)