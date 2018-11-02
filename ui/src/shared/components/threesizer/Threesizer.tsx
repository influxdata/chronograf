import React, {
  PureComponent,
  ReactElement,
  MouseEvent,
  CSSProperties,
} from 'react'
import classnames from 'classnames'
import uuid from 'uuid'
import _ from 'lodash'

import Division from 'src/shared/components/threesizer/Division'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {MenuItem} from 'src/shared/components/threesizer/DivisionMenu'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'

import {
  HANDLE_NONE,
  HANDLE_PIXELS,
  HANDLE_HORIZONTAL,
  HANDLE_VERTICAL,
  MIN_SIZE,
  MAX_SIZE,
} from 'src/shared/constants/'

const initialDragEvent: DragEvent = {
  percentX: 0,
  percentY: 0,
  mouseX: null,
  mouseY: null,
}

interface State {
  activeHandleID: string
  divisions: DivisionState[]
  dragDirection: string
  dragEvent: DragEvent
}

interface DragEvent {
  mouseX: number
  mouseY: number
  percentX: number
  percentY: number
}

interface DivisionProps {
  name?: string
  handleDisplay?: string
  handlePixels?: number
  style?: CSSProperties
  customClass?: string
  size?: number
  headerButtons?: JSX.Element[]
  menuOptions: MenuItem[]
  render: (visibility: string, pixels: number) => ReactElement<any>
}

interface DivisionState extends DivisionProps {
  id: string
  size: number
}

interface Props {
  divisions: DivisionProps[]
  orientation: string
  containerClass?: string
  onResize: (sizes: number[]) => void
}

@ErrorHandling
class Threesizer extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    orientation: HANDLE_HORIZONTAL,
    containerClass: '',
  }

  private containerRef: HTMLElement
  private percentChangeX: number
  private percentChangeY: number
  private debouncer: Debouncer = new DefaultDebouncer()

  constructor(props) {
    super(props)
    this.state = {
      activeHandleID: null,
      divisions: this.divisions,
      dragEvent: initialDragEvent,
      dragDirection: '',
    }
  }

  public componentDidMount() {
    document.addEventListener('mouseup', this.handleStopDrag)
    document.addEventListener('mouseleave', this.handleStopDrag)
  }

  public componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleStopDrag)
    document.removeEventListener('mouseleave', this.handleStopDrag)
  }

  public componentDidUpdate(__, prevState: State) {
    const {dragEvent, divisions} = this.state
    const {orientation} = this.props

    const stateDivisionSizes = divisions.map(d => d.size)
    const propDivisionSizes = this.props.divisions.map(d => d.size)

    const updateDivisions = this.state.divisions.map((d, i) => ({
      ...d,
      size: this.props.divisions[i].size,
    }))

    if (!_.isEqual(propDivisionSizes, stateDivisionSizes)) {
      this.setState({
        divisions: updateDivisions,
      })
    }

    if (_.isEqual(dragEvent, prevState.dragEvent)) {
      return
    }

    this.percentChangeX = this.percentChange(
      prevState.dragEvent.percentX,
      dragEvent.percentX
    )
    this.percentChangeY = this.percentChange(
      prevState.dragEvent.percentY,
      dragEvent.percentY
    )

    const {percentX, percentY} = dragEvent
    const {dragEvent: prevDrag} = prevState

    if (orientation === HANDLE_VERTICAL && percentX < prevDrag.percentX) {
      this.move.left()
    } else if (orientation === HANDLE_VERTICAL) {
      this.move.right()
    } else if (percentY < prevDrag.percentY) {
      this.move.up()
    } else {
      this.move.down()
    }

    this.handleResize()
  }

  public render() {
    const {activeHandleID, divisions} = this.state
    const {orientation} = this.props

    return (
      <div
        className={this.className}
        onMouseUp={this.handleStopDrag}
        onMouseMove={this.handleDrag}
        ref={r => (this.containerRef = r)}
      >
        {divisions.map((d, i) => {
          const headerOrientation = _.get(d, 'headerOrientation', orientation)
          return (
            <Division
              key={d.id}
              id={d.id}
              name={d.name}
              size={d.size}
              style={d.style}
              offset={this.offset}
              draggable={i > 0}
              customClass={d.customClass}
              orientation={orientation}
              handlePixels={d.handlePixels}
              handleDisplay={d.handleDisplay}
              activeHandleID={activeHandleID}
              onMaximize={this.handleMaximize}
              onMinimize={this.handleMinimize}
              onEqualize={this.equalize}
              headerOrientation={headerOrientation}
              onDoubleClick={this.handleDoubleClick}
              render={this.props.divisions[i].render}
              onHandleStartDrag={this.handleStartDrag}
              menuOptions={this.props.divisions[i].menuOptions}
              headerButtons={this.props.divisions[i].headerButtons}
            />
          )
        })}
      </div>
    )
  }

  private get offset(): number {
    const handlesPixelCount = this.state.divisions.reduce((acc, d) => {
      if (d.handleDisplay === HANDLE_NONE) {
        return acc
      }

      return acc + d.handlePixels
    }, 0)

    return handlesPixelCount
  }

  private get className(): string {
    const {orientation, containerClass} = this.props
    const {activeHandleID} = this.state

    return classnames(`threesizer ${containerClass}`, {
      dragging: activeHandleID,
      horizontal: orientation === HANDLE_HORIZONTAL,
      vertical: orientation === HANDLE_VERTICAL,
    })
  }

  private get divisions() {
    const {divisions} = this.props

    const defaultSize = 1 / divisions.length

    return divisions.map(d => {
      let size = defaultSize
      if (d.size || d.size === 0) {
        size = d.size
      }

      return {
        ...d,
        id: uuid.v4(),
        size,
        handlePixels: d.handlePixels || HANDLE_PIXELS,
      }
    })
  }

  private handleResize = () => {
    this.debouncer.call(this.handleResizeImmediate, 100)
  }

  private handleResizeImmediate = () => {
    const {onResize} = this.props

    if (!onResize) {
      return
    }

    onResize(this.state.divisions.map(d => d.size))
  }

  private handleDoubleClick = (id: string): void => {
    const clickedDiv = this.state.divisions.find(d => d.id === id)

    if (!clickedDiv) {
      return
    }

    const isMaxed = clickedDiv.size === 1

    if (isMaxed) {
      return this.equalize()
    }

    const divisionSizes = this.state.divisions.map(d => {
      if (d.id !== id) {
        return 0
      }

      return 1
    })

    this.props.onResize(divisionSizes)
  }

  private handleMaximize = (id: string): void => {
    const maxDiv = this.state.divisions.find(d => d.id === id)

    if (!maxDiv) {
      return
    }

    const divisionSizes = this.state.divisions.map(d => {
      if (d.id !== id) {
        return 0
      }

      return 1
    })

    this.props.onResize(divisionSizes)
  }

  private handleMinimize = (id: string): void => {
    const minDiv = this.state.divisions.find(d => d.id === id)
    const numDivisions = this.state.divisions.length

    if (!minDiv) {
      return
    }

    let size
    if (numDivisions <= 1) {
      size = 1
    } else {
      size = 1 / (this.state.divisions.length - 1)
    }

    const divisionSizes = this.state.divisions.map(d => {
      if (d.id !== id) {
        return size
      }

      return 0
    })

    this.props.onResize(divisionSizes)
  }

  private equalize = () => {
    const denominator = this.state.divisions.length
    const divisionSizes = this.state.divisions.map(__ => {
      return 1 / denominator
    })

    this.props.onResize(divisionSizes)
  }

  private handleStartDrag = (activeHandleID, e: MouseEvent<HTMLElement>) => {
    const dragEvent = this.mousePosWithinContainer(e)
    this.setState({activeHandleID, dragEvent})
  }

  private handleStopDrag = () => {
    if (this.state.activeHandleID) {
      this.setState({activeHandleID: '', dragEvent: initialDragEvent})
    }
  }

  private mousePosWithinContainer = (e: MouseEvent<HTMLElement>): DragEvent => {
    const {pageY, pageX} = e
    const {top, left, width, height} = this.containerRef.getBoundingClientRect()

    const mouseX = pageX - left
    const mouseY = pageY - top

    const percentX = mouseX / width
    const percentY = mouseY / height

    return {
      mouseX,
      mouseY,
      percentX,
      percentY,
    }
  }

  private percentChange = (startValue, endValue) => {
    if (!startValue || !endValue) {
      return 0
    }
    const delta = Math.abs(startValue - endValue)
    return delta
  }

  private handleDrag = (e: MouseEvent<HTMLElement>) => {
    const {activeHandleID} = this.state
    if (!activeHandleID) {
      return
    }

    const dragEvent = this.mousePosWithinContainer(e)

    this.setState({dragEvent})
  }

  private get move() {
    const {activeHandleID} = this.state

    const activePosition = _.findIndex(
      this.state.divisions,
      d => d.id === activeHandleID
    )

    return {
      up: this.up(activePosition),
      down: this.down(activePosition),
      left: this.left(activePosition),
      right: this.right(activePosition),
    }
  }

  private up = activePosition => () => {
    const divisionSizes = this.state.divisions.map((d, i) => {
      if (!activePosition) {
        return d.size
      }

      const first = i === 0
      const before = i === activePosition - 1
      const current = i === activePosition

      if (first && !before) {
        const second = this.state.divisions[1]
        if (second && second.size === 0) {
          return this.shorter(d.size)
        }

        return d.size
      }

      if (before) {
        return this.shorter(d.size)
      }

      if (current) {
        return this.taller(d.size)
      }

      return d.size
    })

    this.props.onResize(divisionSizes)
  }

  private left = activePosition => () => {
    const divisionSizes = this.state.divisions.map((d, i) => {
      if (!activePosition) {
        return d.size
      }

      const first = i === 0
      const before = i === activePosition - 1
      const active = i === activePosition

      if (first && !before) {
        const second = this.state.divisions[1]
        if (second && second.size === 0) {
          return this.thinner(d.size)
        }

        return d.size
      }

      if (before) {
        return this.thinner(d.size)
      }

      if (active) {
        return this.fatter(d.size)
      }

      return d.size
    })

    this.props.onResize(divisionSizes)
  }

  private taller = (size: number): number => {
    const newSize = size + this.percentChangeY
    return this.enforceMax(newSize)
  }
  private fatter = (size: number): number => {
    const newSize = size + this.percentChangeX
    return this.enforceMax(newSize)
  }
  private shorter = (size: number): number => {
    const newSize = size - this.percentChangeY
    return this.enforceMin(newSize)
  }
  private thinner = (size: number): number => {
    const newSize = size - this.percentChangeX
    return this.enforceMin(newSize)
  }

  private right = activePosition => () => {
    const divisionSizes = this.state.divisions.map((d, i, divs) => {
      const before = i === activePosition - 1
      const active = i === activePosition
      const after = i === activePosition + 1

      if (before) {
        return this.fatter(d.size)
      }

      if (active) {
        return this.thinner(d.size)
      }

      if (after) {
        const leftIndex = i - 1
        const left = _.get(divs, leftIndex, {size: 'none'})

        if (left && left.size === 0) {
          return this.thinner(d.size)
        }

        return d.size
      }

      return d.size
    })

    this.props.onResize(divisionSizes)
  }

  private down = activePosition => () => {
    const divisionSizes = this.state.divisions.map((d, i, divs) => {
      const before = i === activePosition - 1
      const current = i === activePosition
      const after = i === activePosition + 1

      if (before) {
        return this.taller(d.size)
      }

      if (current) {
        return this.shorter(d.size)
      }

      if (after) {
        const above = divs[i - 1]
        if (above && above.size === 0) {
          return this.shorter(d.size)
        }

        return d.size
      }

      return d.size
    })

    this.props.onResize(divisionSizes)
  }

  private enforceMax = (size: number): number => {
    return size > MAX_SIZE ? MAX_SIZE : size
  }

  private enforceMin = (size: number): number => {
    return size < MIN_SIZE ? MIN_SIZE : size
  }
}

export default Threesizer
