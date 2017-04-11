import React, {Component, PropTypes} from 'react'
import {getMeasurements, getGallery} from 'src/gallery/apis'
import {Links} from 'src/utils/ajax'

class GalleryApp extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const measurements = getMeasurements(this.props.source.links.proxy, this.props.source.telegraf)
    Links().then(({data}) => {
      getGallery(data.dashboardd, measurements).then((resp) => {
        console.log(resp.data)
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
