from(bucket: "test")
	|> range(start:2018-05-22T19:53:26Z)
	|> drop(columns: ["_field"])
	|> filter(fn: (r) => r._field == "usage_guest")
