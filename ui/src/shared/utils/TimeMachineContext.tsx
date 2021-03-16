import React, {createContext, useContext, useState} from 'react'
import {TimeMachineContainer, TimeMachineState} from './TimeMachineContainer'

interface Props {
  children: (a: TimeMachineContainer) => JSX.Element
}

const TimeMachineContext = createContext<TimeMachineState | undefined>(
  undefined
)

const container = new TimeMachineContainer()

export const TimeMachineContextConsumer = ({children}: Props) => {
  const value = useContext(TimeMachineContext)
  if (value === undefined) {
    throw new Error(
      'Component must be wrapped with <TimeMachineContextProvider>'
    )
  }
  return children(container)
}

// optimization only
let lastSetState: unknown

export const TimeMachineContextProvider: React.FC = ({children}) => {
  const [state, setState] = useState(container.state)
  container.state = state
  if (setState !== lastSetState) {
    // setState is stable in React, so this should be executed at most once
    container.setState = function (s: Partial<TimeMachineState>) {
      setState((previous: TimeMachineState) => ({...previous, ...s}))
    }
    lastSetState = setState
  }
  return (
    <TimeMachineContext.Provider value={state}>
      {children}
    </TimeMachineContext.Provider>
  )
}

export {TimeMachineContainer} from './TimeMachineContainer'
