import {bodyNodes} from 'src/flux/helpers'
import suggestions from 'test/flux/semantic_graph/suggestions'
import Variables from 'test/flux/ast/variables'
import {Expression, StringLiteral} from 'test/flux/ast/variable'
import From from 'test/flux/ast/from'

const id = expect.any(String)

describe('Flux.helpers', () => {
  describe('bodyNodes', () => {
    describe('bodyNodes for Expressions assigned to a variable', () => {
      it('can parse an Expression assigned to a Variable', () => {
        const actual = bodyNodes(Expression, suggestions)
        const expected = [
          {
            declarations: [
              {
                funcs: [
                  {
                    args: [{key: 'db', type: 'string', value: 'telegraf'}],
                    id,
                    name: 'from',
                    source: 'from(bucket: "telegraf")',
                  },
                ],
                id,
                name: 'tele',
                source: 'tele = from(bucket: "telegraf")',
                type: 'CallExpression',
              },
            ],
            id,
            source: 'tele = from(bucket: "telegraf")',
            type: 'VariableDeclaration',
          },
        ]

        expect(actual).toEqual(expected)
      })
    })

    describe('bodyNodes for a Literal assigned to a Variable', () => {
      it('can parse an Expression assigned to a Variable', () => {
        const actual = bodyNodes(StringLiteral, suggestions)
        const expected = [
          {
            id,
            source: 'bux = "im a var"',
            type: 'VariableDeclaration',
            declarations: [
              {
                id,
                name: 'bux',
                type: 'StringLiteral',
                value: 'im a var',
              },
            ],
          },
        ]

        expect(actual).toEqual(expected)
      })
    })

    describe('bodyNodes for an Expression', () => {
      it('can parse an Expression into bodyNodes', () => {
        const actual = bodyNodes(From, suggestions)

        const expected = [
          {
            declarations: [],
            funcs: [
              {
                args: [{key: 'db', type: 'string', value: 'telegraf'}],
                id,
                name: 'from',
                source: 'from(bucket: "telegraf")',
              },
            ],
            id,
            source: 'from(bucket: "telegraf")',
            type: 'CallExpression',
          },
        ]

        expect(actual).toEqual(expected)
      })
    })
  })

  describe('multiple bodyNodes', () => {
    it('can parse variables and expressions together', () => {
      const actual = bodyNodes(Variables, suggestions)
      const expected = [
        {
          declarations: [
            {
              id,
              name: 'bux',
              type: 'StringLiteral',
              value: 'ASDFASDFASDF',
            },
          ],
          id,
          source: 'bux = "ASDFASDFASDF"',
          type: 'VariableDeclaration',
        },
        {
          declarations: [
            {
              funcs: [
                {
                  args: [{key: 'db', type: 'string', value: 'foo'}],
                  id,
                  name: 'from',
                  source: 'from(bucket: "foo")',
                },
              ],
              id,
              name: 'foo',
              source: 'foo = from(bucket: "foo")',
              type: 'CallExpression',
            },
          ],
          id,
          source: 'foo = from(bucket: "foo")',
          type: 'VariableDeclaration',
        },
        {
          declarations: [],
          funcs: [
            {
              args: [{key: 'db', type: 'string', value: 'bux'}],
              id,
              name: 'from',
              source: 'from(bucket: bux)',
            },
          ],
          id,
          source: 'from(bucket: bux)',
          type: 'CallExpression',
        },
      ]

      expect(actual).toEqual(expected)
    })
  })
})
