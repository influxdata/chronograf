import {autoflow} from 'src/hosts/utils/autoflow';

describe.only('autoflow', () => {
  it('renders 3x3 grid', () => {
    const layouts = [
      { cells: [{}], },
      { cells: [{}], },
      { cells: [{}], },
      { cells: [{}, {}], },
      { cells: [{}], },
      { cells: [{}], },
      { cells: [{}, {}], },
    ];

    const actual = autoflow(layouts);

    const expected = [
      { w: 4, h: 4, x: 0, y: 0, },
      { w: 4, h: 4, x: 4, y: 0, },
      { w: 4, h: 4, x: 8, y: 0, },
      { w: 4, h: 4, x: 0, y: 4, },
      { w: 4, h: 4, x: 4, y: 4, },
      { w: 4, h: 4, x: 8, y: 4, },
      { w: 4, h: 4, x: 0, y: 8, },
      { w: 4, h: 4, x: 4, y: 8, },
      { w: 4, h: 4, x: 8, y: 8, },
    ];
  });
});

describe.only('autoflow', () => {
  it('renders 3x4 grid', () => {
    const layouts = [
    { cells: [{}], },
    { cells: [{}], },
    { cells: [{}], },
    { cells: [{}], },
    { cells: [{}], },
    { cells: [{}], },
    { cells: [{}, {}], },
    { cells: [{}, {}], },
    { cells: [{}, {}], },
  ];

    const actual = autoflow(layouts);

    const expected = [
      { w: 4, h: 4, x: 0, y: 0, },
      { w: 4, h: 4, x: 4, y: 0, },
      { w: 4, h: 4, x: 8, y: 0, },
      { w: 4, h: 4, x: 0, y: 4, },
      { w: 4, h: 4, x: 4, y: 4, },
      { w: 4, h: 4, x: 8, y: 4, },
      { w: 4, h: 4, x: 0, y: 8, },
      { w: 4, h: 4, x: 4, y: 8, },
      { w: 4, h: 4, x: 8, y: 8, },
      { w: 4, h: 4, x: 0, y: 12, },
      { w: 4, h: 4, x: 4, y: 12, },
      { w: 4, h: 4, x: 8, y: 12, },
    ];
  });
});
