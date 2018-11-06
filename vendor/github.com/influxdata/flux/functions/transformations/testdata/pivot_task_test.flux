from(bucketID: "000000000000000a")
    |> range(start: 2018-10-02T17:55:11.520461Z)
	|> filter(fn: (r) => r._measurement == "records" and r.taskID == "02bac3c8f0f37000" )
	|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
