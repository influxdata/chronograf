// Constants
import {FUNCTIONS} from 'src/flux/constants'

// Types
import {Suggestion} from 'src/types/flux'

export const getSuggestions = (): Suggestion[] => {
  return FUNCTIONS.map(({args, name}) => {
    const params = args.reduce((acc, {name: argName, type}) => {
      acc[argName] = type
      return acc
    }, {})

    return {name, params}
  })
}
