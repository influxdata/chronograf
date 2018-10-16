import {getMinDurationFromAST} from 'src/shared/parsing/flux/durations'
import {AST_TESTS} from 'test/shared/parsing/flux/durations'

describe('getMinDurationFromAST', () => {
  test.each(AST_TESTS)('%s:\n\n```\n%s\n```', (__, ___, expected, ast) => {
    expect(getMinDurationFromAST(ast)).toEqual(expected)
  })
})
