import parse from 'utils/influxql/parse.pegjs'
import Tracer from 'pegjs-backtrace'

describe('parsing', () => {
  describe('measurements', () => {
    it('works with the simplest select statement evar', () => {
      const stmt = "SELECT foo FROM bar"
      const actual = parse.parse(stmt)
      expect(actual.from).to.equal("bar")
    })

    it('works with quoted measurement names', () => {
      const stmt = "SELECT foo FROM \"bar quux\""
      const actual = parse.parse(stmt)
      expect(actual.from).to.equal("bar quux")
    })

    it('works with subqueries', () => {
      const stmt = "SELECT mean(usage) as avg, median(usage) as median FROM ( select 100 - usage_idle as usage from cpu )"
      const actual = parse.parse(stmt)
      expect(actual).to.exist
    })

    it('works with fully-qualified measurement names', () => {
      const stmt = "select mean(usage_idle) from \"telegraf\".\"autogen\".\"cpu\""
      const actual = parse.parse(stmt)
      expect(actual).to.exist
    })

    it('works with implicit rp', () => {
      const stmt = "select mean(usage_idle) from \"telegraf\"..\"cpu\""
      const actual = parse.parse(stmt)
      expect(actual).to.exist
    })

    it('works with implicit db', () => {
      const stmt = "select mean(usage_idle) from \"autogen\".\"cpu\""
      const actual = parse.parse(stmt)
      console.log(JSON.stringify(actual))
      expect(actual).to.exist
    })
  })

  describe('group by', () => {
    it('works with one tag', () => {
      const stmt = "select usage_idle from cpu group by host"
      const actual = parse.parse(stmt)
      expect(actual).to.exist
    })

    it('works with multiple tags', () => {
      const stmt = "select usage_idle from cpu group by host,\"cpu\", az"
      const actual = parse.parse(stmt)
      expect(actual).to.exist
    })

    it('works with time', () => {
      const stmt = "select usage_idle from cpu group by time(10m)"
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      console.log(JSON.stringify(actual))
      expect(actual).to.exist
    })
  })

  describe('where clauses', () => {
    it('works with simple clauses', () => {
      const stmt = "SELECT usage_idle FROM cpu WHERE \"host\" = \"host\""
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      expect(actual.clause.type).to.equal("BinaryExpr")
      //expect(actual.clause.operands.length).to.equal(1, JSON.stringify(actual.clause.operands))
    })

    it('works with conjunctions', () => {
      const stmt = "SELECT usage_idle FROM cpu WHERE \"host\" = \"host\" AND \"cpu\" = \"cpu\""
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      expect(actual.clause.type).to.equal("BinaryExpr")
      //expect(actual.clause.operands.length).to.equal(2, JSON.stringify(actual.clause.operands))
    })

    it('works with time expressions', () => {
      const stmt = "SELECT usage_idle FROM cpu WHERE time > now() - 15m"
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      expect(actual.clause.type).to.equal("BinaryExpr")
      //expect(actual.clause.operands.length).to.equal(2, JSON.stringify(actual.clause.operands))
    })

    it('works with absolute time expressions', () => {
      const stmt = "SELECT usage_idle FROM cpu WHERE time > '2015-01-01T00:00:00.000-04:00' AND time < '2016-01-01T00:00:00.000Z'"
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      expect(actual.clause.type).to.equal("BinaryExpr")
      //expect(actual.clause.operands.length).to.equal(2, JSON.stringify(actual.clause.operands))
    })

    it('works with hybrid time clauses', () => {
      const stmt = "SELECT usage_idle FROM cpu WHERE time > now() - 2y AND time < '2016-01-01T00:00:00.000Z'"
      const tracer = new Tracer(stmt, {
        showTrace: false, // suppress noisy log output
      })
      let actual
      try {
        actual = parse.parse(stmt, {tracer})
      } catch (e) {
        console.log(e)
        console.log(tracer.getBacktraceString())
      }
      expect(actual.clause.type).to.equal("BinaryExpr")
      //expect(actual.clause.operands.length).to.equal(2, JSON.stringify(actual.clause.operands))
    })
  })

  describe('fields', () => {
    describe('math', () => {
      it('extracts fields with math', () => {
        const stmt = "select usage_idle + 30 from cpu"
        const tracer = new Tracer(stmt, {
          showTrace: false, // suppress noisy log output
        })
        let actual
        try {
          actual = parse.parse(stmt, {tracer})
        } catch (e) {
          console.log(e)
          console.log(tracer.getBacktraceString())
        }
        expect(actual).to.exist
      })
    })

    describe('aggregates', () => {
      it('extracts fields with aggregates', () => {
        const stmt = "select mean(usage_idle) from cpu"
        const tracer = new Tracer(stmt, {
          showTrace: false, // suppress noisy log output
        })
        let actual
        try {
          actual = parse.parse(stmt, {tracer})
        } catch (e) {
          console.log(e)
          console.log(tracer.getBacktraceString())
        }
        expect(actual).to.exist
      })
    })

    describe('type casts', () => {
      it('works with type casts', () => {
        const stmt = "select mean(usage_idle::field) as avg from cpu"
        const tracer = new Tracer(stmt, {
          showTrace: false, // suppress noisy log output
        })
        let actual
        try {
          actual = parse.parse(stmt, {tracer})
        } catch (e) {
          console.log(e)
          console.log(tracer.getBacktraceString())
        }
        expect(actual).to.exist
      })
    })

    describe('aliases', () => {
      it('supports field aliasing with aggregates', () => {
        const stmt = "select mean(usage_idle) as avg from cpu"
        const tracer = new Tracer(stmt, {
          showTrace: false, // suppress noisy log output
        })
        let actual
        try {
          actual = parse.parse(stmt, {tracer})
        } catch (e) {
          console.log(e)
          console.log(tracer.getBacktraceString())
        }
        expect(actual).to.exist
      })

      it('supports field aliasing with math', () => {
        const stmt = "select usage_idle::tag * 30 + 5 as avg from cpu"
        const tracer = new Tracer(stmt, {
          showTrace: false, // suppress noisy log output
        })
        let actual
        try {
          actual = parse.parse(stmt, {tracer})
        } catch (e) {
          console.log(e)
          console.log(tracer.getBacktraceString())
        }
        expect(actual).to.exist
      })
    })
  })
})
