import React, {ReactNode, SFC} from 'react'

interface Props {
  children: ReactNode
}

const TimeMachineBottom: SFC<Props> = ({children}) => (
  <div className="deceo--bottom">{children}</div>
)

export default TimeMachineBottom
