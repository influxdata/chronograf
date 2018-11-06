from(bucket:"testdb")
  |> range(start: 2018-05-22T00:00:00Z, stop:2018-05-22T00:01:00Z)
  |> aggregateWindow(every:30s,fn:mean)
