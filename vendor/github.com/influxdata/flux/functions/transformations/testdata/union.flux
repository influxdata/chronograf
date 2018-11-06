left = from(bucket: "test")
    |> range(start: 2018-05-22T19:53:00Z, stop: 2018-05-22T19:53:50Z)
    |> filter(fn: (r) => r._field == "usage_guest" or r._field == "usage_guest_nice")
    |> drop(columns: ["_start", "_stop"])

right = from(bucket: "test")
    |> range(start: 2018-05-22T19:53:50Z, stop: 2018-05-22T19:54:20Z)
    |> filter(fn: (r) => r._field == "usage_guest" or r._field == "usage_idle")
    |> drop(columns: ["_start", "_stop"])

union(tables: [left, right])
    |> sort(columns: ["_time"])
