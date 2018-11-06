from(bucket: "test")
	|> range(start:2018-05-22T19:53:26Z)
	|> rename(fn: (column) => column)
	|> drop(fn: (column) => column == "_start" or column == "_stop")
