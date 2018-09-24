// Libraries
import _ from 'lodash'

// Constants
import {builder, argTypes} from 'src/flux/constants'

// Types
import {FlatBody, InputArg, Func, DeleteFuncNodeArgs} from 'src/types/flux'

interface Body extends FlatBody {
  id: string
}

interface Status {
  type: string
  text: string
}

export const changeArg = (
  {key, value, funcID, declarationID = '', bodyID}: InputArg,
  bodies: Body[]
): Body[] => {
  return bodies.map(b => {
    if (b.id !== bodyID) {
      return b
    }

    if (declarationID) {
      const declarations = b.declarations.map(d => {
        if (d.id !== declarationID) {
          return d
        }

        const functions = editFuncArgs({
          funcs: d.funcs,
          funcID,
          key,
          value,
        })

        return {...d, funcs: functions}
      })

      return {...b, declarations}
    }

    const funcs = editFuncArgs({
      funcs: b.funcs,
      funcID,
      key,
      value,
    })

    return {...b, funcs}
  })
}

export const editFuncArgs = ({funcs, funcID, key, value}): Func[] => {
  return funcs.map(f => {
    if (f.id !== funcID) {
      return f
    }

    const args = f.args.map(a => {
      if (a.key === key) {
        return {...a, value}
      }

      return a
    })

    return {...f, args}
  })
}

export const getBodyToScript = (body: Body[]): string => {
  return body.reduce((acc, b) => {
    if (b.declarations.length) {
      const declaration = _.get(b, 'declarations.0', false)
      if (!declaration) {
        return acc
      }

      if (!declaration.funcs) {
        return `${acc}${b.source}`
      }

      return `${acc}${declaration.name} = ${funcsToScript(
        declaration.funcs
      )}\n\n`
    }

    return `${acc}${funcsToScript(b.funcs)}\n\n`
  }, '')
}

export const funcsToScript = (funcs): string => {
  return funcs
    .map(func => `${func.name}(${argsToScript(func.args)})`)
    .join('\n\t|> ')
}

export const argsToScript = (args): string => {
  const withValues = args.filter(arg => arg.value || arg.value === false)

  return withValues
    .map(({key, value, type}) => {
      if (type === argTypes.STRING) {
        return `${key}: "${value}"`
      }

      if (type === argTypes.ARRAY) {
        return `${key}: ["${value}"]`
      }

      if (type === argTypes.OBJECT) {
        const valueString = _.map(value, (v, k) => k + ':' + v).join(',')
        return `${key}: {${valueString}}`
      }

      return `${key}: ${value}`
    })
    .join(', ')
}

export const appendJoin = (script: string): string => {
  return `${script.trim()}\n\n${builder.NEW_JOIN}\n\n`
}

export const appendFrom = (script: string): string => {
  return `${script.trim()}\n\n${builder.NEW_FROM}\n\n`
}

export const addNode = (
  name: string,
  bodyID: string,
  declarationID: string,
  bodies: Body[]
): string => {
  return bodies.reduce((acc, body) => {
    const {id, source, funcs} = body

    if (id === bodyID) {
      const declaration = body.declarations.find(d => d.id === declarationID)
      if (declaration) {
        return `${acc}${declaration.name} = ${appendFunc(
          declaration.funcs,
          name
        )}`
      }

      return `${acc}${appendFunc(funcs, name)}`
    }

    return `${acc}${formatSource(source)}`
  }, '')
}

export const appendFunc = (funcs: Func[], name: string): string => {
  return `${funcsToScript(funcs)}\n\t|> ${name}()\n\n`
}

export const deleteBody = (bodyID: string, bodies: Body[]) => {
  const newBody = bodies.filter(b => b.id !== bodyID)
  return getBodyToScript(newBody)
}

// funcsToSource takes a list of funtion nodes and returns an flux script
export const funcsToSource = (funcs): string => {
  return funcs.reduce((acc, f, i) => {
    if (i === 0) {
      return `${f.source}`
    }
    return `${acc}\n\t${f.source}`
  }, '')
}

export const formatSource = (source: string): string => {
  // currently a bug in the AST which does not add newlines to literal variable assignment bodies
  if (!source.match(/\n\n/)) {
    return `${source}\n\n`
  }

  return `${source}`
}

// formats the last line of a body string to include two new lines
export const formatLastSource = (source: string, isLast: boolean): string => {
  if (isLast) {
    return `${source}`
  }

  // currently a bug in the AST which does not add newlines to literal variable assignment bodies
  if (!source.match(/\n\n/)) {
    return `${source}\n\n`
  }

  return `${source}\n\n`
}

export const deleteFuncNode = (
  ids: DeleteFuncNodeArgs,
  bodies: Body[]
): string => {
  const {funcID, declarationID = '', bodyID, yieldNodeID = ''} = ids
  return bodies
    .map((body, bodyIndex) => {
      if (body.id !== bodyID) {
        return formatSource(body.source)
      }
      const isLast = bodyIndex === bodies.length - 1
      if (declarationID) {
        const declaration = body.declarations.find(d => d.id === declarationID)
        if (!declaration) {
          return
        }
        const functions = declaration.funcs.filter(
          f => f.id !== funcID && f.id !== yieldNodeID
        )
        const s = funcsToSource(functions)
        return `${declaration.name} = ${formatLastSource(s, isLast)}`
      }
      const funcs = body.funcs.filter(
        f => f.id !== funcID && f.id !== yieldNodeID
      )
      const source = funcsToSource(funcs)
      return formatLastSource(source, isLast)
    })
    .join('')
}

export const getNextYieldName = (bodies: Body[]): string => {
  const yieldNamePrefix = 'results_'
  const yieldNamePattern = `${yieldNamePrefix}(\\d+)`
  const regex = new RegExp(yieldNamePattern)
  const MIN = -1
  const yieldsMaxResultNumber = bodies.reduce((scriptMax, body) => {
    const {funcs: bodyFuncs, declarations} = body
    let funcs = bodyFuncs
    if (!_.isEmpty(declarations)) {
      funcs = _.flatMap(declarations, d => _.get(d, 'funcs', []))
    }
    const yields = funcs.filter(f => f.name === 'yield')
    const bodyMax = yields.reduce((max, y) => {
      const yieldArg = _.get(y, 'args.0.value')
      if (!yieldArg) {
        return max
      }
      const yieldNumberString = _.get(yieldArg.match(regex), '1', `${MIN}`)
      const yieldNumber = parseInt(yieldNumberString, 10)
      return Math.max(yieldNumber, max)
    }, scriptMax)
    return Math.max(scriptMax, bodyMax)
  }, MIN)
  return `${yieldNamePrefix}${yieldsMaxResultNumber + 1}`
}

export const insertYieldFunc = (
  funcs: Func[],
  index: number,
  bodies: Body[]
): string => {
  const funcsBefore = funcs.slice(0, index + 1)
  const funcsBeforeScript = funcsToScript(funcsBefore)
  const funcsAfter = funcs.slice(index + 1)
  const funcsAfterScript = funcsToScript(funcsAfter)
  const funcSeparator = '\n\t|> '
  if (funcsAfterScript) {
    return `${funcsBeforeScript}${funcSeparator}yield(name: "${getNextYieldName(
      bodies
    )}")${funcSeparator}${funcsAfterScript}\n\n`
  }
  return `${funcsBeforeScript}${funcSeparator}yield(name: "${getNextYieldName(
    bodies
  )}")\n\n`
}

export const removeYieldFunc = (funcs: Func[], funcAfterNode: Func): string => {
  const filteredFuncs = funcs.filter(f => f.id !== funcAfterNode.id)
  return `${funcsToScript(filteredFuncs)}\n\n`
}

export const addOrRemoveYieldFunc = (
  funcs: Func[],
  funcNodeIndex: number,
  bodies: Body[]
): string => {
  if (funcNodeIndex < funcs.length - 1) {
    const funcAfterNode = funcs[funcNodeIndex + 1]
    if (funcAfterNode.name === 'yield') {
      return removeYieldFunc(funcs, funcAfterNode)
    }
  }
  return insertYieldFunc(funcs, funcNodeIndex, bodies)
}

export const toggleYield = (
  bodyID: string,
  declarationID: string,
  funcNodeIndex: number,
  bodies: Body[]
): string => {
  return bodies.reduce((acc, body) => {
    const {id, source, funcs} = body
    if (id === bodyID) {
      const declaration = body.declarations.find(d => d.id === declarationID)
      if (declaration) {
        return `${acc}${declaration.name} = ${addOrRemoveYieldFunc(
          declaration.funcs,
          funcNodeIndex,
          bodies
        )}`
      }
      return `${acc}${addOrRemoveYieldFunc(funcs, funcNodeIndex, bodies)}`
    }
    return `${acc}${formatSource(source)}`
  }, '')
}

export const prepBodyForYield = (
  body: Body,
  declarationID: string,
  yieldNodeIndex: number
) => {
  const funcs = getFuncs(body, declarationID)
  const funcsUpToYield = funcs.slice(0, yieldNodeIndex)
  const yieldNode = funcs[yieldNodeIndex]
  const funcsWithoutYields = funcsUpToYield.filter(f => f.name !== 'yield')
  const funcsForBody = [...funcsWithoutYields, yieldNode]
  if (declarationID) {
    const declaration = body.declarations.find(d => d.id === declarationID)
    const declarations = [{...declaration, funcs: funcsForBody}]
    return {...body, declarations}
  }
  return {...body, funcs: funcsForBody}
}

export const scriptUpToYield = (
  bodyID: string,
  declarationID: string,
  funcNodeIndex: number,
  isYieldable: boolean,
  bodies: Body[]
) => {
  const bodyIndex = bodies.findIndex(b => b.id === bodyID)
  const bodiesBeforeYield = bodies
    .slice(0, bodyIndex)
    .map(b => removeYieldFuncFromBody(b))
  const body = prepBodyForYield(bodies[bodyIndex], declarationID, funcNodeIndex)
  const bodiesForScript = [...bodiesBeforeYield, body]
  let script = getBodyToScript(bodiesForScript)
  if (!isYieldable) {
    const regex: RegExp = /\n{2}$/
    script = script.replace(regex, '\n\t|> last()\n\t|> yield()$&')
    return script
  }
  return script
}

export const getFuncs = (body: Body, declarationID: string): Func[] => {
  const declaration = body.declarations.find(d => d.id === declarationID)
  if (declaration) {
    return _.get(declaration, 'funcs', [])
  }
  return _.get(body, 'funcs', [])
}

export const removeYieldFuncFromBody = (body: Body): Body => {
  const declarationID = _.get(body, 'declarations.0.id')
  const funcs = getFuncs(body, declarationID)
  if (_.isEmpty(funcs)) {
    return body
  }
  const funcsWithoutYields = funcs.filter(f => f.name !== 'yield')
  if (declarationID) {
    const declaration = _.get(body, 'declarations.0')
    const declarations = [{...declaration, funcs: funcsWithoutYields}]
    return {...body, declarations}
  }
  return {...body, funcs: funcsWithoutYields}
}

export const parseError = (error): Status => {
  if (error.data) {
    const s = error.data.slice(0, -5) // There is a 'null\n' at the end of these responses
    const data = JSON.parse(s)
    return {type: 'error', text: data.message}
  }

  return {type: 'error', text: error.message}
}
