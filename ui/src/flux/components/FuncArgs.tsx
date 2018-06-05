import React, {PureComponent, ReactElement} from 'react'
import FuncArg from 'src/flux/components/FuncArg'
import {OnChangeArg} from 'src/types/flux'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Func} from 'src/types/flux'
import {funcNames} from 'src/flux/constants'
import JoinArgs from 'src/flux/components/JoinArgs'
import FilterArgs from 'src/flux/components/FilterArgs'
import {Service} from 'src/types'

interface Props {
  func: Func
  service: Service
  bodyID: string
  onChangeArg: OnChangeArg
  declarationID: string
  onGenerateScript: () => void
  onDeleteFunc: () => void
  declarationsFromBody: string[]
}

@ErrorHandling
export default class FuncArgs extends PureComponent<Props> {
  public renderArgs() {
    const {
      func,
      bodyID,
      service,
      onChangeArg,
      declarationID,
      onGenerateScript,
      declarationsFromBody,
    } = this.props

    const {name: funcName, id: funcID} = func

    switch (funcName) {
      case funcNames.JOIN: {
        return (
          <JoinArgs
            func={func}
            bodyID={bodyID}
            declarationID={declarationID}
            onChangeArg={onChangeArg}
            declarationsFromBody={declarationsFromBody}
            onGenerateScript={onGenerateScript}
          />
        )
      }
      case funcNames.FILTER: {
        return <FilterArgs service={service} db={'telegraf'} />
      }
      default: {
        return func.args.map(({key, value, type}) => (
          <FuncArg
            key={key}
            type={type}
            argKey={key}
            value={value}
            bodyID={bodyID}
            funcID={funcID}
            funcName={funcName}
            service={service}
            onChangeArg={onChangeArg}
            declarationID={declarationID}
            onGenerateScript={onGenerateScript}
          />
        ))
      }
    }
  }
  public render() {
    const {onDeleteFunc} = this.props

    return (
      <div className="func-node--tooltip">
        {this.renderArgs()}
        <div className="func-node--buttons">
          <div
            className="btn btn-sm btn-danger func-node--delete"
            onClick={onDeleteFunc}
          >
            Delete
          </div>
          {this.build}
        </div>
      </div>
    )
  }

  get build(): ReactElement<HTMLDivElement> {
    const {func, onGenerateScript} = this.props
    if (func.name === funcNames.FILTER) {
      return (
        <div
          className="btn btn-sm btn-primary func-node--build"
          onClick={onGenerateScript}
        >
          Build
        </div>
      )
    }

    return null
  }
}
