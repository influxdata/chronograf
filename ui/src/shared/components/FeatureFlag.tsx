import {FunctionComponent} from 'react'

interface Props {
  name?: string
  children?: any
}

const FeatureFlag: FunctionComponent<Props> = props => {
  if (process.env.NODE_ENV === 'development') {
    return props.children
  }

  return null
}

export default FeatureFlag
