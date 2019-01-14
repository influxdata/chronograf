t_keys = (table=<-) =>
  table
  |> range(start: 2018-05-20T19:53:26Z)
  |> filter(fn: (r) => r._measurement == "diskio")
  |> keys(except:["_time", "_start", "_stop", "_field", "_measurement", "_value"])
  |> group()
  |> distinct(column:"_value")
  |> yield(name:"0")
testingTest(name: "keys", load: testLoadData, infile: "keys.in.csv", outfile: "keys.out.csv", test: t_keys)