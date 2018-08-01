import React, {PureComponent, ReactElement} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {CardSelectCardProps} from 'src/types/cardSelect'

import 'src/reusable_ui/components/card_select/CardSelectList.scss'

interface Props {
  children: Array<ReactElement<CardSelectCardProps>>
  legend: string
}

@ErrorHandling
class CardSelectList extends PureComponent<Props> {
  public render() {
    const {children} = this.props

    return (
      <fieldset className="card-select--wrapper">
        <div className="card-select--cards">{children}</div>
      </fieldset>
    )
  }
}

export default CardSelectList
