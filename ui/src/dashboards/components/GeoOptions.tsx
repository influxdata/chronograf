// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Actions
import {UpdateGeoImage} from 'src/shared/actions/visualizations'

interface Props {
  onUpdateGeoImage: () => void
}

class GeoOptions extends PureComponent<Props> {
  public render() {
    const {
      geo_range_x0,
      geo_range_x1,
      geo_range_y0,
      geo_range_y1,
      geo_imageUrl,
      geo_imageScale,
      geo_image_x0,
      geo_image_y0,
      geo_dot_color,
    } = this.props

    return (
      <div style={{padding: '20px'}}>
        <h5>Geo Options</h5>
        <hr />
        <h6>Value Range</h6>
        <label>
          X From:
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_range_x0}
            name="geo_range_x0"
          />
        </label>
        <label>
          X To:
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_range_x1}
            name="geo_range_x1"
          />
        </label>
        <label>
          Y From:
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_range_y0}
            name="geo_range_y0"
          />
        </label>
        <label>
          Y To:
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_range_y1}
            name="geo_range_y1"
          />
        </label>

        <hr />
        <h6>Image Options</h6>
        <label>
          Image URL
          <input
            className="form-control input-sm customizable-field--input"
            type="text"
            onChange={this.handleUpdateGeoImage}
            value={geo_imageUrl}
            name="geo_imageUrl"
          />
        </label>
        <label>
          Image Scale
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_imageScale}
            name="geo_imageScale"
          />
        </label>
        <label>
          Image Position X
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_image_x0}
            name="geo_image_x0"
          />
        </label>
        <label>
          Image Position Y
          <input
            className="form-control input-sm customizable-field--input"
            type="number"
            onChange={this.handleUpdateGeoImage}
            value={geo_image_y0}
            name="geo_image_y0"
          />
        </label>
        <hr />
        <h6>Marker Options</h6>
        <label>
          Color
          <input
            className="form-control input-sm customizable-field--input"
            type="text"
            onChange={this.handleUpdateGeoImage}
            value={geo_dot_color}
            name="geo_dot_color"
          />
        </label>
      </div>
    )
  }

  private handleUpdateGeoImage = e => {
    const val = e.target.value
    const name = e.target.name
    this.props.onUpdateGeoImage({name, val})
  }
}

const mstp = state => ({
  geo_range_x0: state.cellEditorOverlay.geo_range_x0,
  geo_range_x1: state.cellEditorOverlay.geo_range_x1,
  geo_range_y0: state.cellEditorOverlay.geo_range_y0,
  geo_range_y1: state.cellEditorOverlay.geo_range_y1,
  geo_imageUrl: state.cellEditorOverlay.geo_imageUrl,
  geo_imageScale: state.cellEditorOverlay.geo_imageScale,
  geo_image_x0: state.cellEditorOverlay.geo_image_x0,
  geo_image_y0: state.cellEditorOverlay.geo_image_y0,
  geo_dot_color: state.cellEditorOverlay.geo_dot_color,
})

export default connect(mstp)(GeoOptions)
