import React, {PureComponent} from 'react'
import _ from 'lodash'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ExpressionNode from 'src/flux/components/ExpressionNode'
import VariableName from 'src/flux/components/VariableName'
import FuncSelector from 'src/flux/components/FuncSelector'
import {funcNames} from 'src/flux/constants'

import {Service} from 'src/types'
import {FlatBody, Suggestion} from 'src/types/flux'

interface Props {
  service: Service
  body: Body[]
  suggestions: Suggestion[]
  onAppendFrom: () => void
  onAppendJoin: () => void
}

interface Body extends FlatBody {
  id: string
}

class BodyBuilder extends PureComponent<Props> {
  public render() {
    const bodybuilder = this.props.body.map((b, i) => {
      if (b.declarations.length) {
        return b.declarations.map(d => {
          if (d.funcs) {
            return (
              <div className="declaration" key={i}>
                <VariableName name={d.name} assignedToQuery={true} />
                <ExpressionNode
                  bodyID={b.id}
                  declarationID={d.id}
                  funcNames={this.funcNames}
                  funcs={d.funcs}
                  declarationsFromBody={this.declarationsFromBody}
                />
              </div>
            )
          }

          return (
            <div className="declaration" key={i}>
              <VariableName name={b.source} assignedToQuery={false} />
            </div>
          )
        })
      }

      return (
        <div className="declaration" key={i}>
          <ExpressionNode
            bodyID={b.id}
            funcs={b.funcs}
            funcNames={this.funcNames}
            declarationsFromBody={this.declarationsFromBody}
          />
        </div>
      )
    })

    return (
      <FancyScrollbar className="body-builder--container" autoHide={true}>
        <div className="body-builder">
          {_.flatten(bodybuilder)}
          <div className="declaration">
            <FuncSelector
              bodyID="fake-body-id"
              declarationID="fake-declaration-id"
              onAddNode={this.createNewBody}
              funcs={this.newDeclarationFuncs}
              connectorVisible={false}
            />
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private get newDeclarationFuncs(): string[] {
    const {body} = this.props
    const declarationFunctions = [funcNames.FROM]
    if (body.length > 1) {
      declarationFunctions.push(funcNames.JOIN)
    }
    return declarationFunctions
  }

  private get declarationsFromBody(): string[] {
    const {body} = this.props
    const declarations = _.flatten(
      body.map(b => {
        if ('declarations' in b) {
          const declarationsArray = b.declarations
          return declarationsArray.map(da => da.name)
        }
        return []
      })
    )
    return declarations
  }

  private createNewBody = name => {
    if (name === funcNames.FROM) {
      this.props.onAppendFrom()
    }
    if (name === funcNames.JOIN) {
      this.props.onAppendJoin()
    }
  }

  private get funcNames() {
    return this.props.suggestions.map(f => f.name)
  }
}

export default BodyBuilder
