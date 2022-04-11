// Libraries
import React, {PureComponent} from 'react'
import classnames from 'classnames'

// Components
import BuilderCardHeader from './BuilderCardHeader'
import BuilderCardDropdownHeader from './BuilderCardDropdownHeader'
import BuilderCardMenu from './BuilderCardMenu'
import BuilderCardBody from './BuilderCardBody'
import BuilderCardEmpty from './BuilderCardEmpty'

interface Props {
  testID?: string
  className?: string
  widthPixels?: number
}
export default class BuilderCard extends PureComponent<Props> {
  public static Header = BuilderCardHeader
  public static DropdownHeader = BuilderCardDropdownHeader
  public static Menu = BuilderCardMenu
  public static Body = BuilderCardBody
  public static Empty = BuilderCardEmpty

  public static defaultProps = {
    testID: 'builder-card',
    widthPixels: 228,
  }

  public render() {
    const {children, testID, className, widthPixels} = this.props

    const classname = classnames('builder-card', {[`${className}`]: className})

    const style = {flex: `0 0 ${widthPixels}px`}

    return (
      <div className={classname} data-test={testID} style={style}>
        {children}
      </div>
    )
  }
}
