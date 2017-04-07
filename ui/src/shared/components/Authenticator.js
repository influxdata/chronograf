import React, {PropTypes} from 'react'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {Route} from 'react-router'
import {getSources as getSourcesAsync} from 'shared/actions/sources'
import {CreateSource} from 'src/sources'

const Authenticator = ({
  sources,
  getSources,
  component: App,
  children,
}) => {
  console.log(sources)

  if (sources === null) {
    getSources()
  }

  if (sources === 'REQUESTED') {
    return <div className="page-spinner"></div>
  }

  if (Array.isArray(sources) && sources.length === 0) {
    return <Route path="/" component={CreateSource} />
  }

  return (
    <Route path="/sources/:sourceID">
      <App>{children}</App>
    </Route>
  )
}

const mapStateToProps = ({sources}) => ({
  sources,
})

const mapDispatchToProps = (dispatch) => ({
  getSources: bindActionCreators(getSourcesAsync, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Authenticator)
