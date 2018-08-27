// Libraries
import React, {PureComponent} from 'react'

interface Props {
  displayText?: string
}

class ProtoboardIcon extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    displayText: '',
  }

  public render() {
    return (
      <div className="protoboard-icon">
        <svg
          version="1.1"
          id="protoboard_icon"
          x="0px"
          y="0px"
          viewBox="0 0 80 64.8"
        >
          <g>
            <g>
              <g>
                <path
                  className="protoboard-icon--shape"
                  d="M31.3,5.8v27.4H2V5.8H31.3 M31.4,3.8H1.9C0.9,3.8,0,4.7,0,5.7v27.6c0,1.1,0.9,1.9,1.9,1.9h29.5
				c1.1,0,1.9-0.9,1.9-1.9V5.7C33.3,4.7,32.5,3.8,31.4,3.8L31.4,3.8z"
                />
              </g>
              <g>
                <path
                  className="protoboard-icon--shape"
                  d="M31.3,43v16H2V43H31.3 M31.4,41H1.9C0.9,41,0,41.8,0,42.9V59C0,60.1,0.9,61,1.9,61h29.5
				c1.1,0,1.9-0.9,1.9-1.9V42.9C33.3,41.8,32.5,41,31.4,41L31.4,41z"
                />
              </g>
              <g>
                <path
                  className="protoboard-icon--shape"
                  d="M41,61h37.1c1.1,0,1.9-0.9,1.9-1.9V21.9c0-1.1-0.9-1.9-1.9-1.9H41c-1.1,0-1.9,0.9-1.9,1.9V59
				C39,60.1,39.9,61,41,61z"
                />
              </g>
              <g>
                <path
                  className="protoboard-icon--shape"
                  d="M78,5.8v6.5H41V5.8H78 M78.1,3.8H41c-1.1,0-1.9,0.9-1.9,1.9v6.7c0,1.1,0.9,1.9,1.9,1.9h37.1
				c1.1,0,1.9-0.9,1.9-1.9V5.7C80,4.7,79.1,3.8,78.1,3.8L78.1,3.8z"
                />
              </g>
            </g>
            <text
              transform="matrix(1 0 0 1 59.5 55.8103)"
              textAnchor="middle"
              className="protoboard-icon--text"
            >
              {this.displayInitial}
            </text>
          </g>
        </svg>
      </div>
    )
  }

  private get displayInitial() {
    const {displayText} = this.props
    return displayText.substring(0, 1).toUpperCase()
  }
}

export default ProtoboardIcon
