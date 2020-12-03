import React, {FunctionComponent, ReactChildren} from 'react'

import SideNav from 'src/side_nav'
import Notifications from 'src/shared/components/Notifications'

interface Props {
  children: ReactChildren
}

const App: FunctionComponent<Props> = ({children}) => (
  <div className="chronograf-root">
    <Notifications />
    <SideNav />
    {children}
  </div>
)

export default App
