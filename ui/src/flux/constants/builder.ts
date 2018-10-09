export const getNewFromScript = (
  telegrafDB: string,
  defaultRP: string
): string => {
  const bucket = defaultRP ? `${telegrafDB}/${defaultRP}` : telegrafDB
  return `from(bucket: "${bucket}")\n\t|> filter(fn: (r) => r._measurement == "cpu")\n\t|> range(start: dashboardTime)`
}

export const NEW_JOIN = `join(tables:{fil:fil, tele:tele}, on:["host"], fn:(tables) => tables.fil["_value"] + tables.tele["_value"])`
