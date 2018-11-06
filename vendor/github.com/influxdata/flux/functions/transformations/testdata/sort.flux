from(bucket:"testdb")
  |> range(start: 2018-05-22T19:53:26Z)
  |> sort(columns:["_value", "_time"])
