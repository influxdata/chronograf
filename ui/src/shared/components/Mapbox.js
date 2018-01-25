/* eslint-disable no-magic-numbers */
import React, {Component, PropTypes} from 'react'

import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken =
  'pk.eyJ1IjoiZGVuaXprIiwiYSI6ImNqY3Rwd2pvejNzcDkyeG54N2V2aHM1dm4ifQ.b-JDlEXOCQlqXR1uHJWYNQ'

class Mapbox extends Component {
  constructor(props) {
    super(props)
    this.state={
      lat: this.props.lat,
      lng: this.props.lng,
      zoom: this.props.zoom
    }
  }

  componentDidMount() {
    const {lng, lat, zoom} = this.state

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [lng, lat],
      zoom,
    })

    map.on('move', () => {
      const {lng, lat} = map.getCenter()

      this.setState({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      })
    })
  }

  render() {
    const {lng, lat, zoom} = this.state

    return (
      <div>
        <div className="inline-block absolute top left mt12 ml12 bg-darken75 color-white z1 py6 px12 round-full txt-s txt-bold">
          <div>{`Longitude: ${lng} Latitude: ${lat} Zoom: ${zoom}`}</div>
        </div>
        <div
          ref={el => (this.mapContainer = el)}
          className="absolute top right left bottom"
        />
      </div>
    )
  }
}

export default Mapbox
