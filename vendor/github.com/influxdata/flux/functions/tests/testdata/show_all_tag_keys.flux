t_show_all_tag_keys = (table=<-) =>
  table
  |> range(start:2018-05-22T19:53:26Z)
  |> keys(except: ["_time","_value","_start","_stop"])
  |> group()
  |> distinct()
  |> map(fn:(r) => r._value)
testingTest(name: "show_all_tag_keys", load: testLoadData, infile: "show_all_tag_keys.in.csv", outfile: "show_all_tag_keys.out.csv", test: t_show_all_tag_keys)