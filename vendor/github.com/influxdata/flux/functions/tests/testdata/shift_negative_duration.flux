t_shift_negative_duration = (table=<-) => table
  |> shift(shift: -5m)

testingTest(
    name: "shift_negative_duration",
    load: testLoadData,
    infile: "shift_negative_duration.in.csv",
    outfile: "shift_negative_duration.out.csv",
    test: t_shift_negative_duration,
)
