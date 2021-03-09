import React, {FunctionComponent, ReactElement} from 'react'

interface Props {
  children: ReactElement<any>
}

const SplashPage: FunctionComponent<Props> = ({children}) => (
  <div className="auth-page">
    <div className="auth-box">
      <div className="auth-logo" />
      {children}
    </div>
    <p className="auth-credits">
      Made by <span className="icon cubo-uniform" />
      InfluxData
    </p>
    <div className="auth-image" />
  </div>
)

export default SplashPage
