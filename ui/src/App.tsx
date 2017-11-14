import * as React from 'react'

import {bindActionCreators, compose} from 'redux'
import {connect} from 'react-redux'
import {History, Location} from 'history'

import SideNav from 'side_nav/containers/SideNav'
import Notifications from 'shared/components/Notifications'
import {checkSources} from './CheckSources'

import {publishNotification} from 'shared/actions/notifications'

import {Action, Dispatch} from 'src/types/redux'
import {Source} from 'src/types'

export interface AppProps {
  notify: Action
  history: History
  location: Location
  source: Source
  sources: Source[]
  match: {}
}

const handleAddFlashMessage = notify => ({type, text}) => {
  notify(type, text)
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  notify: bindActionCreators(publishNotification, dispatch),
})

export const withApp = Component => {
  const App: React.SFC<AppProps> = ({notify, source, sources}) => (
    <div className="chronograf-root">
      <Notifications />
      <SideNav />
      <Component
        source={source}
        sources={sources}
        addFlashMessage={handleAddFlashMessage(notify)}
      />
    </div>
  )

  return compose(connect(null, mapDispatchToProps), checkSources)(App)
}
