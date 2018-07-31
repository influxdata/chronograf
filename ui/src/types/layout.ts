import {TimeSeriesServerResponse} from 'src/types/series'

export type GrabDataForDownload = (
  timeSeries: TimeSeriesServerResponse[]
) => void
