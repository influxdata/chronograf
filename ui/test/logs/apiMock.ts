export const getSyslogMeasurement = jest.fn()

jest.mock('src/logs/api', () => ({
  getSyslogMeasurement,
}))
