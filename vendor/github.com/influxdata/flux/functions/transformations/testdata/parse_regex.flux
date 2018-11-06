filterRegex = /inodes*/

from(bucket:"test")
    |> range(start:2018-05-20T19:53:26Z)
    |> filter(fn: (r) => r._field =~ filterRegex)
    |> max()