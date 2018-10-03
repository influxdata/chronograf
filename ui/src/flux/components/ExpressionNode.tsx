import React, {PureComponent, Fragment} from 'react'

import FuncSelector from 'src/flux/components/FuncSelector'
import FuncNode from 'src/flux/components/FuncNode'
import YieldFuncNode from 'src/flux/components/YieldFuncNode'
import {getDeep} from 'src/utils/wrappers'
import {scriptUpToYield} from 'src/flux/helpers/scriptBuilder'

import {Func} from 'src/types/flux'
import {FluxTable, Query, TimeRange, Source} from 'src/types'
import {
  Body,
  OnAddNode,
  OnChangeArg,
  OnDeleteFuncNode,
  OnGenerateScript,
  OnToggleYield,
} from 'src/types/flux'

interface Props {
  body: Body[]
  funcs: Func[]
  bodyID: string
  funcNames: any[]
  isLastBody: boolean
  declarationID?: string
  declarationsFromBody: string[]
  onDeleteBody: (bodyID: string) => void
  wasFuncSelectorClicked: boolean
  setWasFuncSelectorClicked: (val: boolean) => void
  onAddNode: OnAddNode
  onChangeArg: OnChangeArg
  onDeleteFuncNode: OnDeleteFuncNode
  onGenerateScript: OnGenerateScript
  onToggleYield: OnToggleYield
  source: Source
  data: FluxTable[]
  queries: Query[]
  timeRange: TimeRange
}

interface State {
  nonYieldableIndexesToggled: {
    [x: number]: boolean
  }
}

// an Expression is a group of one or more functions
class ExpressionNode extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      nonYieldableIndexesToggled: {},
    }
  }

  public render() {
    const {
      body,
      declarationID,
      bodyID,
      funcNames,
      funcs,
      declarationsFromBody,
      onDeleteBody,
      wasFuncSelectorClicked,
      setWasFuncSelectorClicked,
      onDeleteFuncNode,
      onAddNode,
      onChangeArg,
      onGenerateScript,
      onToggleYield,
      data,
      source,
      timeRange,
      queries,
    } = this.props

    const {nonYieldableIndexesToggled} = this.state

    let isAfterRange = false
    let isAfterFilter = false

    return (
      <>
        {funcs.map((func, i) => {
          if (func.name === 'yield') {
            return null
          }

          if (func.name === 'range') {
            isAfterRange = true
          }

          if (func.name === 'filter') {
            isAfterFilter = true
          }
          const isYieldable = isAfterFilter && isAfterRange

          const funcNode = (
            <FuncNode
              key={func.id}
              index={i}
              func={func}
              funcs={funcs}
              bodyID={bodyID}
              source={source}
              onChangeArg={onChangeArg}
              onDelete={onDeleteFuncNode}
              onToggleYield={onToggleYield}
              isYieldable={isYieldable}
              isYielding={this.isBeforeYielding(i)}
              isYieldedInScript={this.isYieldNodeIndex(i + 1)}
              declarationID={declarationID}
              onGenerateScript={onGenerateScript}
              declarationsFromBody={declarationsFromBody}
              onToggleYieldWithLast={this.handleToggleYieldWithLast}
              onDeleteBody={onDeleteBody}
              wasFuncSelectorClicked={wasFuncSelectorClicked}
              setWasFuncSelectorClicked={setWasFuncSelectorClicked}
            />
          )

          if (nonYieldableIndexesToggled[i] || this.isYieldNodeIndex(i + 1)) {
            const script: string = scriptUpToYield(
              bodyID,
              declarationID,
              i,
              isYieldable,
              body
            )

            let yieldFunc = func

            if (this.isYieldNodeIndex(i + 1)) {
              yieldFunc = funcs[i + 1]
            }

            return (
              <Fragment key={`${i}-notInScript`}>
                {funcNode}
                <YieldFuncNode
                  index={i}
                  func={yieldFunc}
                  data={data}
                  script={script}
                  bodyID={bodyID}
                  source={source}
                  queries={queries}
                  timeRange={timeRange}
                  declarationID={declarationID}
                />
              </Fragment>
            )
          }

          return funcNode
        })}
        <FuncSelector
          bodyID={bodyID}
          funcs={funcNames}
          onAddNode={onAddNode}
          declarationID={declarationID}
          setWasFuncSelectorClicked={setWasFuncSelectorClicked}
        />
      </>
    )
  }

  private isBeforeYielding(funcIndex: number): boolean {
    const {nonYieldableIndexesToggled} = this.state
    const beforeToggledLastYield = !!nonYieldableIndexesToggled[funcIndex]

    if (beforeToggledLastYield) {
      return true
    }

    return this.isYieldNodeIndex(funcIndex + 1)
  }

  private isYieldNodeIndex(funcIndex: number): boolean {
    const {funcs} = this.props
    const funcName = getDeep<string>(funcs, `${funcIndex}.name`, '')

    return funcName === 'yield'
  }

  // if funcNode is not yieldable, add last before yield()
  private handleToggleYieldWithLast = (funcNodeIndex: number): void => {
    this.setState(({nonYieldableIndexesToggled}) => {
      const isFuncYieldToggled = !!nonYieldableIndexesToggled[funcNodeIndex]

      return {
        nonYieldableIndexesToggled: {
          ...nonYieldableIndexesToggled,
          [funcNodeIndex]: !isFuncYieldToggled,
        },
      }
    })
  }
}

export default ExpressionNode
