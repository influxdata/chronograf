import buildInfluxQLQuery from 'utils/influxql';
import defaultQueryConfig from 'src/utils/defaultQueryConfig';

function mergeConfig(options) {
  return Object.assign({}, defaultQueryConfig(123), options);
}

describe('buildInfluxQLQuery', () => {
  let config, timeBounds;
  describe('when information is missing', () => {
    it('returns a null select statement', () => {
      expect(buildInfluxQLQuery({}, mergeConfig())).to.equal(null);
      expect(buildInfluxQLQuery({}, mergeConfig({database: 'db1'}))).to.equal(null); // no measurement
      expect(buildInfluxQLQuery({}, mergeConfig({database: 'db1', measurement: 'm1'}))).to.equal(null); // no fields
    });
  });

  describe('with a database, measurement, field, and NO retention policy', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', measurement: 'm1', fields: [{field: 'f1', func: null}]});
    });

    it('builds the right query', () => {
      expect(buildInfluxQLQuery({}, config)).to.equal('SELECT "f1" FROM "db1".."m1"');
    });
  });

  describe('with a database, measurement, retention policy, and field', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', measurement: 'm1', retentionPolicy: 'rp1', fields: [{field: 'f1', func: null}]});
      timeBounds = {lower: 'now() - 1hr'};
    });

    it('builds the right query', () => {
      expect(buildInfluxQLQuery({}, config)).to.equal('SELECT "f1" FROM "db1"."rp1"."m1"');
    });

    it('builds the right query with a time range', () => {
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal('SELECT "f1" FROM "db1"."rp1"."m1" WHERE time > now() - 1hr');
    });
  });

  describe('when the field is *', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', measurement: 'm1', retentionPolicy: 'rp1', fields: [{field: '*', func: null}]});
    });

    it('does not quote the star', () => {
      expect(buildInfluxQLQuery({}, config)).to.equal('SELECT * FROM "db1"."rp1"."m1"');
    });
  });

  describe('with a measurement and one field, an aggregate, and a GROUP BY time()', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', measurement: 'm0', retentionPolicy: 'rp1', fields: [{field: 'value', funcs: ['min']}], groupBy: {time: '10m', tags: []}});
      timeBounds = {lower: 'now() - 12h'};
    });

    it('builds the right query', () => {
      const expected = 'SELECT min("value") AS "min_value" FROM "db1"."rp1"."m0" WHERE time > now() - 12h GROUP BY time(10m)';
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
    });
  });

  describe('with a measurement and one field, an aggregate, and a GROUP BY tags', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', measurement: 'm0', retentionPolicy: 'rp1', fields: [{field: 'value', funcs: ['min']}], groupBy: {time: null, tags: ['t1', 't2']}});
      timeBounds = {lower: 'now() - 12h'};
    });

    it('builds the right query', () => {
      const expected = `SELECT min("value") AS "min_value" FROM "db1"."rp1"."m0" WHERE time > now() - 12h GROUP BY "t1", "t2"`;
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
    });
  });

  describe('with a measurement, one field, and an upper / lower absolute time range', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', retentionPolicy: 'rp1', measurement: 'm0', fields: [{field: 'value', funcs: []}]});
      timeBounds = {lower: "'2015-07-23T15:52:24.447Z'", upper: "'2015-07-24T15:52:24.447Z'"};
    });

    it('builds the right query', () => {
      const expected = 'SELECT "value" FROM "db1"."rp1"."m0" WHERE time > \'2015-07-23T15:52:24.447Z\' AND time < \'2015-07-24T15:52:24.447Z\'';
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
    });
  });

  describe('with a measurement and one field, an aggregate, and a GROUP BY time(), and tags', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', retentionPolicy: 'rp1', measurement: 'm0', fields: [{field: 'value', funcs: ['min']}], groupBy: {time: '10m', tags: ['t1', 't2']}});
      timeBounds = {lower: 'now() - 12h'};
    });

    it('builds the right query', () => {
      const expected = 'SELECT min("value") AS "min_value" FROM "db1"."rp1"."m0" WHERE time > now() - 12h GROUP BY time(10m), "t1", "t2"';
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
    });
  });

  describe('with a measurement and two fields', () => {
    beforeEach(() => {
      config = mergeConfig({database: 'db1', retentionPolicy: 'rp1', measurement: 'm0', fields: [{field: 'f0', funcs: []}, {field: 'f1', funcs: []}]});
      timeBounds = {upper: "'2015-02-24T00:00:00Z'"};
    });

    it('builds the right query', () => {
      expect(buildInfluxQLQuery({}, config)).to.equal('SELECT "f0", "f1" FROM "db1"."rp1"."m0"');
    });

    it('builds the right query with a time range', () => {
      const expected = `SELECT "f0", "f1" FROM "db1"."rp1"."m0" WHERE time < '2015-02-24T00:00:00Z'`;
      expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
    });

    describe('with multiple tag pairs', () => {
      beforeEach(() => {
        config = mergeConfig({
          database: 'db1',
          measurement: 'm0',
          retentionPolicy: 'rp1',
          fields: [{field: 'f0', funcs: []}],
          tags: {
            k1: [
              'v1',
              'v3',
              'v4',
            ],
            k2: [
              'v2',
            ]
          },
        });
        timeBounds = {lower: 'now() - 6h'};
      });

      it('correctly uses AND/OR to combine pairs', () => {
        const expected = `SELECT "f0" FROM "db1"."rp1"."m0" WHERE time > now() - 6h AND ("k1"='v1' OR "k1"='v3' OR "k1"='v4') AND "k2"='v2'`;
        expect(buildInfluxQLQuery(timeBounds, config)).to.equal(expected);
      });
    });
  });
});
