import React, {FunctionComponent, ReactNode} from 'react'

interface Props {
  children: ReactNode
}

const OverlayBody: FunctionComponent<Props> = ({children}) => (
  <div className="overlay--body">{children}</div>
)

export default OverlayBody
