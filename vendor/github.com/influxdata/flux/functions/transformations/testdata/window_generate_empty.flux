from(bucket: "test")
	|> range(start:2018-05-22T19:53:26Z, stop: 2018-05-22T19:55:00Z)
	|> window(every: 30s, createEmpty: true)
