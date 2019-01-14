t_shift = (table=<-) => table
  |> shift(shift: 120s)

testingTest(
    name: "shift",
    load: testLoadData,
    infile: "shift.in.csv",
    outfile: "shift.out.csv",
    test: t_shift,
)
