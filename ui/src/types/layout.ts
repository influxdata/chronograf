import {TimeSeriesServerResponse} from 'src/types/series'

export type GrabDataForDownloadHandler = (
  timeSeries: TimeSeriesServerResponse[]
) => void
