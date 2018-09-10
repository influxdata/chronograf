regexFunc = (regLiteral) =>
   from(bucket:"testdb")
     |>  range(start:2018-05-20T19:53:26Z)
     |>  filter(fn: (r) => r._field =~ regLiteral)
     |>  max()

regexFunc(regLiteral: /io.*/)