import * as React from 'react'

import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import SideNav from 'side_nav/containers/SideNav'
import Notifications from 'shared/components/Notifications'
import CheckSources from './CheckSources'

import {publishNotification} from 'shared/actions/notifications'

import {Dispatch} from 'src/types/redux'

export interface AppProps {
  children: React.ReactChildren
  notify: typeof publishNotification
}

const handleAddFlashMessage = notify => ({type, text}) => {
  notify(type, text)
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  notify: bindActionCreators(publishNotification, dispatch),
})

const bla = b => {
  console.log('bla', b)
  return b
}

export const withApp = (
  Component
): React.ComponentClass & {
  WrappedComponent: React.ComponentType<AppProps>
} => {
  const App: React.SFC<AppProps> = props => (
    <CheckSources>
      <div className="chronograf-root">
        <Notifications />
        <SideNav />
        <Component
          {...bla(props)}
          addFlashMessage={handleAddFlashMessage(props.notify)}
        />
      </div>
    </CheckSources>
  )

  return connect(null, mapDispatchToProps)(App)
}
