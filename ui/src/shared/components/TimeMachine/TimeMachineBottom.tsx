import React, {ReactNode, FunctionComponent} from 'react'

interface Props {
  children: ReactNode
}

const TimeMachineBottom: FunctionComponent<Props> = ({children}) => (
  <div className="deceo--bottom">{children}</div>
)

export default TimeMachineBottom
