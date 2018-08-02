import React, {PureComponent, ReactElement} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {CardSelectCardProps} from 'src/types/cardSelect'

interface Props {
  children: Array<ReactElement<CardSelectCardProps>>
  legend: string
}

@ErrorHandling
class CardSelectList extends PureComponent<Props> {
  public render() {
    const {children, legend} = this.props

    return (
      <fieldset className="card-select--wrapper">
        <legend>{legend}</legend>
        <div className="card-select--cards">{children}</div>
      </fieldset>
    )
  }
}

export default CardSelectList
