import * as React from 'react'
import * as ReactDOM from 'react-dom'

const enhanceWithClickOutside = <T extends {}>(WrappedComponent) => {
  const componentName = WrappedComponent.displayName || WrappedComponent.name

  return class OnClickOutside extends React.Component<T> {
    public wrappedComponent

    public displayName = `Wrapped${componentName}`

    public handleClickOutside = e => {
      const domNode = ReactDOM.findDOMNode(this)
      if (
        (!domNode || !domNode.contains(e.target)) &&
        typeof this.wrappedComponent.handleClickOutside === 'function'
      ) {
        this.wrappedComponent.handleClickOutside(e)
      }
    }

    public componentDidMount() {
      document.addEventListener('click', this.handleClickOutside, true)
    }

    public componentWillUnmount() {
      document.removeEventListener('click', this.handleClickOutside, true)
    }

    public render() {
      return (
        <WrappedComponent
          {...this.props}
          ref={ref => (this.wrappedComponent = ref)}
        />
      )
    }
  }
}

export default enhanceWithClickOutside
