import _ from 'lodash';

/**
 * Accepts an array of raw influxdb responses and returns a format
 * that Dygraph understands.
 */

export default function timeSeriesToDygraph(raw = []) {
  // collect results from each influx response
  const results = raw.reduce((acc, rawResponse, responseIndex) => {
    const responses = _.get(rawResponse, 'response.results', []);
    const {queryID} = rawResponse;
    const indexedResponses = responses.map((response) => ({...response, responseIndex, queryID}));
    return [...acc, ...indexedResponses];
  }, []);

  // collect each series
  const serieses = results.reduce((acc, {series = [], responseIndex, queryID}, index) => {
    return [...acc, ...series.map((item) => ({...item, responseIndex, queryID, index}))];
  }, []);

  // convert series into cells with rows and columns
  const cells = serieses.reduce((acc, {name, columns, values, index, responseIndex, queryID, tags = {}}) => {
    const rows = values.map((vals) => ({
      name,
      columns,
      vals,
      index,
    }));

    // tagSet is each tag key and value for a series
    const tagSet = Object.keys(tags).map((tag) => `[${tag}=${tags[tag]}]`).sort().join('');

    rows.forEach(({vals, columns: cols, name: measurement, index: seriesIndex}) => {
      const [time, ...rowValues] = vals;

      rowValues.forEach((value, i) => {
        const field = cols[i + 1];
        acc.push({
          label: `${measurement}.${field}${tagSet}`,
          value,
          time,
          seriesIndex,
          responseIndex,
          queryID,
        });
      });
    });

    return acc;
  }, []);

  // labels are a unique combination of measurement, fields, and tags that indicate a specific series on the graph legend
  const labels = cells.reduce((acc, {label, seriesIndex, responseIndex, queryID}) => {
    const existingLabel = acc.find(({
      label: findLabel,
      seriesIndex: findSeriesIndex,
    }) => findLabel === label && findSeriesIndex === seriesIndex);

    if (!existingLabel) {
      acc.push({
        label,
        seriesIndex,
        responseIndex,
        queryID,
      });
    }

    return acc;
  }, []);

  const sortedLabels = _.sortBy(labels, 'label');

  const timeSeries = cells.reduce((acc, cell) => {
    let existingRowIndex = acc.findIndex(({time}) => cell.time === time);

    if (existingRowIndex === -1) {
      acc.push({
        time: cell.time,
        values: Array(sortedLabels.length).fill(null),
      });

      existingRowIndex = acc.length - 1;
    }

    const values = acc[existingRowIndex].values;
    const labelIndex = sortedLabels.findIndex(({label, seriesIndex}) => label === cell.label && cell.seriesIndex === seriesIndex);
    values[labelIndex] = cell.value;
    acc[existingRowIndex].values = values;

    return acc;
  }, []);

  const sortedTimeSeries = _.sortBy(timeSeries, 'time');

  return {
    timeSeries: sortedTimeSeries.map(({time, values}) => ([new Date(time), ...values])),
    labels: ["time", ...sortedLabels.map(({label}) => label)],
    sortedLabels,
  };
}
