left = from(bucket: "test")
    |> range(start: 2018-05-22T19:53:00Z, stop: 2018-05-22T19:53:50Z)
    |> filter(fn: (r) => r._measurement == "diskio" AND r._field == "io_time")
    |> group(by: ["host"])
    |> drop(columns: ["_start", "_stop", "name"])

right = from(bucket: "test")
    |> range(start: 2018-05-22T19:53:50Z, stop: 2018-05-22T19:54:20Z)
    |> filter(fn: (r) => r._measurement == "diskio" AND r._field == "read_bytes")
    |> group(by: ["host"])
    |> drop(columns: ["_start", "_stop"])

union(tables: [left, right])
    |> sort(columns: ["_time", "_field", "_value"])
