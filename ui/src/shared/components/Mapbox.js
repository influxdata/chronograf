/* eslint-disable no-magic-numbers */
import React, { Component, PropTypes } from "react";
import _ from "lodash";
import uuid from "node-uuid";

import mapboxgl from "mapbox-gl";

mapboxgl.accessToken =
  "pk.eyJ1IjoiZGVuaXprIiwiYSI6ImNqY3Rwd2pvejNzcDkyeG54N2V2aHM1dm4ifQ.b-JDlEXOCQlqXR1uHJWYNQ";

class Mapbox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: this.props.lat,
      lng: this.props.lng,
      zoom: this.props.zoom
    };
  }

  componentDidMount() {
    const { lng, lat, zoom } = this.state;
    const { data_past, data_curr } = this.props;

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: "mapbox://styles/mapbox/streets-v9",
      center: [lng, lat],
      zoom
    });

    map.on("move", () => {
      const { lng, lat } = map.getCenter();

      this.setState({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });

    map.on("load", function() {
      _.forEach(data_past, linepts => {
        map.addLayer({
          id: uuid.v4(),
          type: "line",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: linepts
              }
            }
          },
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#888",
            "line-width": 8
          }
        });
      });

      const currentPointFeatures = _.reduce(
        data_curr,
        (r, v, k) => {
          r.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [v] },
            properties: { title: "Mapbox " + k, icon: "monument" }
          });
          return r;
        },
        []
      );

      _.forEach(data_curr, (v, k) => {
        console.log(v);
        map.addLayer({
          id: "points" + k,
          type: "symbol",
          source: {
            type: "geojson",
            data: {
              type: "FeatureCollection",

              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: v
                  },
                  properties: {
                    title: "Mapbox DC",
                    icon: "monument"
                  }
                }
              ]
            }
          },
          layout: {
            "icon-image": "{icon}-15",
            "text-field": "{title}",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
          }
        });
      });
    });
  }

  render() {
    const { lng, lat, zoom } = this.state;

    return (
      <div>
        <div className="inline-block absolute top left mt12 ml12 bg-darken75 color-white z1 py6 px12 round-full txt-s txt-bold" />
        <div
          ref={el => (this.mapContainer = el)}
          className="absolute top right left bottom"
        />
      </div>
    );
  }
}

export default Mapbox;
