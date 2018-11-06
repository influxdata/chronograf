from(bucket:"testdb")
  |> range(start: 2018-05-20T19:53:26Z)
  |> distinct(column:"_value")
  |> yield(name:"0")