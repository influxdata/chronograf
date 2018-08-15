export const QUERIES = [
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-0' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-1' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-2' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-3' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-4' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-5' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-6' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-7' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-8' GROUP BY time(1h), host`,
  `SELECT mean("value") FROM "stress"."autogen"."cpu" WHERE time > '2010-01-01' AND time < '2010-01-12' AND "host"='server-9' GROUP BY time(1h), host`,
]
