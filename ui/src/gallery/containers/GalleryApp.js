import React, {Component, PropTypes} from 'react'
import {getMeasurements, getGallery} from 'src/gallery/apis'
import {Links} from 'src/utils/ajax'
import _ from 'lodash'

class GalleryApp extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const source = this.props.source
    getMeasurements(source.links.proxy, source.telegraf).then((measurements) => {
      Links().then(({data}) => {
        getGallery(data.dashboardd, measurements).then((resp) => {
          const apps = _.groupBy(_.get(resp, 'data.layouts', []), 'app')
        })
      })
    })
  }

  render() {
    return (
      <div>

      </div>
    )
  }
}

const {
  shape,
  string,
} = PropTypes

GalleryApp.propTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
    telegraf: string.isRequired,
  }),
}

export default GalleryApp
