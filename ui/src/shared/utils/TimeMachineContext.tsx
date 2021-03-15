import React from 'react'
import {Subscribe} from 'unstated'
import {TimeMachineContainer} from './TimeMachineContainer'

interface Props {
  children: (TimeMachineContainer) => React.ReactNode
}

export const TimeMachineContextConsumer = ({children}: Props) => (
  <Subscribe to={[TimeMachineContainer]}>
    {(value: TimeMachineContainer) => children(value)}
  </Subscribe>
)
export {TimeMachineContainer} from './TimeMachineContainer'
