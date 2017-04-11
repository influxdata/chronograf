import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {fetchLayouts} from 'shared/apis'
import GalleryDashboard from '../components/GalleryDashboard'

import {setAutoRefresh} from 'shared/actions/app'
import {presentationButtonDispatcher} from 'shared/dispatchers'

class GalleryApp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      layouts: [],
    }
  }

  componentDidMount() {
    const {params: {app}} = this.props

    fetchLayouts().then(({data: {layouts}}) => {
      const appLayouts = layouts.filter((l) => l.app === app)
      this.setState({layouts: appLayouts})
    })
  }

  render() {
    const {layouts} = this.state
    const {autoRefresh, handleChooseAutoRefresh, handleClickPresentationButton, inPresentationMode, params: {app}, source} = this.props

    return (
      <GalleryDashboard
        app={app}
        layouts={layouts}
        source={source}
        autoRefresh={autoRefresh}
        handleChooseAutoRefresh={handleChooseAutoRefresh}
        inPresentationMode={inPresentationMode}
        handleClickPresentationButton={handleClickPresentationButton}
      />
    )
  }
}

const {
  bool,
  func,
  number,
  shape,
  string,
} = PropTypes

GalleryApp.propTypes = {
  autoRefresh: number.isRequired,
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
  }),
  handleChooseAutoRefresh: func.isRequired,
  handleClickPresentationButton: func,
  inPresentationMode: bool.isRequired,
  params: shape({
    app: string.isRequired,
  }).isRequired,
}

const mapStateToProps = ({app: {ephemeral: {inPresentationMode}, persisted: {autoRefresh}}}) => ({
  inPresentationMode,
  autoRefresh,
})

const mapDispatchToProps = (dispatch) => ({
  handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  handleClickPresentationButton: presentationButtonDispatcher(dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(GalleryApp)
