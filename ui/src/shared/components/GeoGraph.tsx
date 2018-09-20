import React, {Component} from 'react'
import {connect} from 'react-redux'

// Types
import {TimeSeriesServerResponse} from 'src/types/series'
import {FluxTable} from 'src/types/flux'
import {DataType} from 'src/shared/constants'

interface Props {
  data: TimeSeriesServerResponse[] | FluxTable[]
  dataType: DataType
  x0?: number
  y0?: number
  rScale?: number
  geo_range_x0: number
  geo_range_x1: number
  geo_range_y0: number
  geo_range_y1: number
  geo_imageUrl: string
  geo_imageScale: number
  geo_image_x0: number
  geo_image_y0: number
  geo_dot_color: string
}

interface Dot {
  x: number
  y: number
  radius?: number
  color?: string
}

class GeoGraph extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    x0: 20,
    y0: 200,
    rScale: 2,
  }

  private canvasRef: React.RefObject<HTMLCanvasElement>

  constructor(props: Props) {
    super(props)

    this.canvasRef = React.createRef()
  }

  public componentDidMount() {
    const self = this

    const dots = this.convertToDots()
    this.drawBackground(
      0,
      0,
      1.5,
      'https://preview.ibb.co/euqrsK/map.jpg',
      () => {
        dots.forEach(dot => {
          const {x0, y0, rScale} = this.props
          self.drawDot({
            ...dot,
            x: dot.x + x0,
            y: dot.y + y0,
            radius: dot.radius * rScale,
          })
        })
      }
    )
  }

  public componentDidUpdate() {
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
    const self = this

    const dots = this.convertToDots()
    this.drawBackground(
      geo_image_x0,
      geo_image_y0,
      geo_imageScale,
      geo_imageUrl || null,
      () => {
        dots.forEach(dot => {
          const {x0, y0, rScale} = this.props
          self.drawDot({
            ...dot,
            x: dot.x + x0,
            y: dot.y + y0,
            radius: dot.radius * rScale,
            color: geo_dot_color,
          })
        })
      }
    )
  }

  public render() {
    return (
      <div>
        <canvas
          id={this.canvasRef}
          width="1000"
          height="600"
          ref={this.canvasRef}
        />
      </div>
    )
  }

  private drawBackground = (x0, y0, scale, src, drawCallback) => {
    const canvas = document.getElementById(this.canvasRef)
    const ctx = canvas.getContext('2d')
    const imageObj = new Image()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    imageObj.src = src

    const calcScale = scale || 1

    imageObj.addEventListener('load', () => {
      ctx.drawImage(
        imageObj,
        x0,
        y0,
        imageObj.naturalWidth * calcScale,
        imageObj.naturalHeight * calcScale
      )
      drawCallback()
    })
  }

  private drawDot = (dot: Dot) => {
    const {x, y, radius, color} = dot

    const canvas = document.getElementById(this.canvasRef)
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.arc(x, y, radius || 10, 0, 2 * Math.PI, false)
    ctx.fillStyle = color || `rgba(255, 0, 0, ${radius / 10})`
    ctx.fill()
  }

  private convertToDots = (): Dots[] => {
    const {data} = this.props
    if (!data) {
      return
    }

    const series = data[0].response.results[0].series[0].values

    return series.reduce((acc, value) => {
      if (!value[1] || !value[2]) {
        return acc
      }

      const dot = {
        x: value[1],
        y: value[2],
        radius: value[3],
      }

      acc = [...acc, dot]

      return acc
    }, [])
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

export default connect(mstp)(GeoGraph)
