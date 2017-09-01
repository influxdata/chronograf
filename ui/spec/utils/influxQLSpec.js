import parse from 'utils/influxql/parse.pegjs'
import Tracer from 'pegjs-backtrace'

describe('parsing', () => {
  describe('measurements', () => {
    it('works with the simplest select statement evar', () => {
      const stmt = "SELECT foo FROM bar"
      const actual = parse.parse(stmt)
      expect(actual.measurement).to.equal("bar")
    })

    it('works with quoted measurement names', () => {
      const stmt = "SELECT foo FROM \"bar quux\""
      const actual = parse.parse(stmt)
      expect(actual.measurement).to.equal("bar quux")
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
      console.log(JSON.stringify(actual))
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
})
