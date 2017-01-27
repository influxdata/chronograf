import {STROKE_WIDTH} from 'src/shared/constants';
const {heavy, light} = STROKE_WIDTH;

export function dygraphHighlighter(labels, activeQueryID) {
  return labels.reduce((acc, {label, queryID}) => {
    acc[label] = {
      strokeWidth: queryID === activeQueryID ? heavy : light,
    };
    return acc;
  }, {});
}

export function dygraphAxisSelector(labels) {
  return labels.reduce((acc, {label, responseIndex}) => {
    acc[label].axis = responseIndex === 0 ? 'y' : 'y2';
    return acc;
  });
}
