import React, {PureComponent} from 'react'
import _ from 'lodash'

import FuncArgInput from 'src/flux/components/FuncArgInput'
import FuncArgTextArea from 'src/flux/components/FuncArgTextArea'
import FuncArgBool from 'src/flux/components/FuncArgBool'
import {ErrorHandling} from 'src/shared/decorators/errors'
import FromDatabaseDropdown from 'src/flux/components/FromDatabaseDropdown'

import {funcNames, argTypes} from 'src/flux/constants'
import {OnChangeArg, Arg, OnGenerateScript} from 'src/types/flux'
import {Service} from 'src/types'

interface Props {
  service: Service
  funcName: string
  funcID: string
  argKey: string
  args: Arg[]
  value: string | boolean | {[x: string]: string}
  type: string
  bodyID: string
  declarationID: string
  onChangeArg: OnChangeArg
  onGenerateScript: OnGenerateScript
  wasFuncSelectorClicked: boolean
  setWasFuncSelectorClicked: (val: boolean) => void
}

@ErrorHandling
class FuncArg extends PureComponent<Props> {
  public componentDidMount() {
    this.props.setWasFuncSelectorClicked(false)
  }

  public render() {
    const {
      argKey,
      value,
      type,
      bodyID,
      funcID,
      service,
      funcName,
      onChangeArg,
      declarationID,
      onGenerateScript,
      wasFuncSelectorClicked,
    } = this.props

    if (funcName === funcNames.FROM) {
      return (
        <FromDatabaseDropdown
          service={service}
          argKey={argKey}
          funcID={funcID}
          value={this.value}
          bodyID={bodyID}
          declarationID={declarationID}
          onChangeArg={onChangeArg}
        />
      )
    }

    switch (type) {
      case argTypes.STRING:
      case argTypes.DURATION:
      case argTypes.TIME:
      case argTypes.REGEXP:
      case argTypes.FLOAT:
      case argTypes.INT:
      case argTypes.UINT:
      case argTypes.INVALID:
      case argTypes.ARRAY: {
        return (
          <FuncArgInput
            type={type}
            value={this.value}
            argKey={argKey}
            funcID={funcID}
            bodyID={bodyID}
            onChangeArg={onChangeArg}
            declarationID={declarationID}
            onGenerateScript={onGenerateScript}
            autoFocus={wasFuncSelectorClicked && this.isFirstArg}
          />
        )
      }

      case argTypes.BOOL: {
        return (
          <FuncArgBool
            value={this.boolValue}
            argKey={argKey}
            bodyID={bodyID}
            funcID={funcID}
            onChangeArg={onChangeArg}
            declarationID={declarationID}
            onGenerateScript={onGenerateScript}
          />
        )
      }
      case argTypes.FUNCTION: {
        return (
          <FuncArgTextArea
            type={type}
            value={this.value}
            argKey={argKey}
            funcID={funcID}
            bodyID={bodyID}
            onChangeArg={onChangeArg}
            declarationID={declarationID}
            onGenerateScript={onGenerateScript}
          />
        )
      }
      case argTypes.NIL: {
        // TODO: handle nil type
        return (
          <div className="func-arg">
            <label className="func-arg--label">{argKey}</label>
            <div className="func-arg--value">{value}</div>
          </div>
        )
      }
      default: {
        return (
          <div className="func-arg">
            <label className="func-arg--label">{argKey}</label>
            <div className="func-arg--value">{value}</div>
          </div>
        )
      }
    }
  }

  private get value(): string {
    return this.props.value.toString()
  }

  private get boolValue(): boolean {
    return this.props.value === true
  }

  private get isFirstArg(): boolean {
    const {args, argKey} = this.props

    const firstArg = _.first(args)

    return firstArg.key === argKey
  }
}

export default FuncArg
