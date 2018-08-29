// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import FluxQueryBuilder from 'src/flux/components/FluxQueryBuilder'
import FluxHeader from 'src/flux/components/FluxHeader'
import TimeMachineVis from 'src/flux/components/TimeMachineVis'
import {ErrorHandling} from 'src/shared/decorators/errors'
import KeyboardShortcuts from 'src/shared/components/KeyboardShortcuts'

// Utils
import {
  addNode,
  appendJoin,
  parseError,
  deleteBody,
  toggleYield,
  deleteFuncNode,
  getBodyToScript,
  scriptUpToYield,
} from 'src/flux/helpers/scriptBuilder'

// Actions
import {
  validateSuccess,
  fluxTimeSeriesError,
  fluxResponseTruncatedError,
} from 'src/shared/copy/notifications'

// Constants
import {bodyNodes} from 'src/flux/helpers'
import {getSuggestions, getAST, getTimeSeries} from 'src/flux/apis'
import {builder, emptyAST} from 'src/flux/constants'
import {HANDLE_HORIZONTAL} from 'src/shared/constants'

// Types
import {UpdateScript} from 'src/flux/actions'
import {Source, Service, Notification, FluxTable} from 'src/types'
import {
  Suggestion,
  FlatBody,
  Links,
  InputArg,
  Context,
  DeleteFuncNodeArgs,
  Func,
  ScriptStatus,
} from 'src/types/flux'
import Threesizer from 'src/shared/components/threesizer/Threesizer'

interface Props {
  links: Links
  service: Service
  services: Service[]
  source: Source
  sources: Source[]
  notify: (message: Notification) => void
  script: string
  updateScript: UpdateScript
  onGoToEditFlux: (service: Service) => void
  onChangeService: (service: Service, source: Source) => void
}

interface Body extends FlatBody {
  id: string
}

interface State {
  body: Body[]
  ast: object
  data: FluxTable[]
  status: ScriptStatus
  suggestions: Suggestion[]
}

type ScriptFunc = (script: string) => void

export const FluxContext = React.createContext(undefined)

@ErrorHandling
export class FluxPage extends PureComponent<Props, State> {
  private debouncedASTResponse: ScriptFunc

  constructor(props) {
    super(props)
    this.state = {
      body: [],
      ast: null,
      data: [],
      suggestions: [],
      status: {
        type: 'none',
        text: '',
      },
    }

    this.debouncedASTResponse = _.debounce(script => {
      this.getASTResponse(script, false)
    }, 250)
  }

  public async componentDidMount() {
    const {links, script} = this.props

    try {
      this.debouncedASTResponse(script)
    } catch (error) {
      console.error('Could not retrieve AST for script', error)
    }

    try {
      const suggestions = await getSuggestions(links.suggestions)
      this.setState({suggestions})
    } catch (error) {
      console.error('Could not get function suggestions: ', error)
    }

    this.getTimeSeries()
  }

  public render() {
    const {service, script} = this.props
    const horizontalDivisions = [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: () => <TimeMachineVis service={service} script={script} />,
        headerOrientation: HANDLE_HORIZONTAL,
      },
      {
        name: '',
        headerButtons: [],
        menuOptions: [],
        render: () => this.fluxQueryBuilder,
        headerOrientation: HANDLE_HORIZONTAL,
      },
    ]
    return (
      <FluxContext.Provider value={this.getContext}>
        <KeyboardShortcuts onControlEnter={this.getTimeSeries}>
          <div className="page hosts-list-page">
            {this.header}
            <Threesizer
              orientation={HANDLE_HORIZONTAL}
              divisions={horizontalDivisions}
              containerClass="page-contents"
            />
          </div>
        </KeyboardShortcuts>
      </FluxContext.Provider>
    )
  }

  private get header(): JSX.Element {
    const {
      service,
      services,
      source,
      sources,
      onGoToEditFlux,
      onChangeService,
    } = this.props

    if (!services.length) {
      return null
    }

    return (
      <FluxHeader
        source={source}
        service={service}
        sources={sources}
        services={services}
        onGoToEditFlux={onGoToEditFlux}
        onChangeService={onChangeService}
      />
    )
  }

  private get getContext(): Context {
    return {
      onAddNode: this.handleAddNode,
      onChangeArg: this.handleChangeArg,
      onSubmitScript: this.handleSubmitScript,
      onChangeScript: this.handleChangeScript,
      onDeleteFuncNode: this.handleDeleteFuncNode,
      onGenerateScript: this.handleGenerateScript,
      onToggleYield: this.handleToggleYield,
      service: this.props.service,
      data: this.state.data,
      scriptUpToYield: this.handleScriptUpToYield,
    }
  }

  private get fluxQueryBuilder(): JSX.Element {
    const {suggestions, body, status} = this.state
    const {script, service, notify} = this.props
    return (
      <FluxQueryBuilder
        body={body}
        notify={notify}
        script={script}
        status={status}
        service={service}
        suggestions={suggestions}
        onValidate={this.handleValidate}
        onAppendFrom={this.handleAppendFrom}
        onAppendJoin={this.handleAppendJoin}
        onChangeScript={this.handleChangeScript}
        onSubmitScript={this.handleSubmitScript}
        onDeleteBody={this.handleDeleteBody}
      />
    )
  }

  private handleSubmitScript = () => {
    this.getASTResponse(this.props.script)
  }

  private handleGenerateScript = (): void => {
    this.getASTResponse(this.bodyToScript)
  }

  private handleChangeArg = ({
    key,
    value,
    generate,
    funcID,
    declarationID = '',
    bodyID,
  }: InputArg): void => {
    const body = this.state.body.map(b => {
      if (b.id !== bodyID) {
        return b
      }

      if (declarationID) {
        const declarations = b.declarations.map(d => {
          if (d.id !== declarationID) {
            return d
          }

          const functions = this.editFuncArgs({
            funcs: d.funcs,
            funcID,
            key,
            value,
          })

          return {...d, funcs: functions}
        })

        return {...b, declarations}
      }

      const funcs = this.editFuncArgs({
        funcs: b.funcs,
        funcID,
        key,
        value,
      })

      return {...b, funcs}
    })

    this.setState({body}, () => {
      if (generate) {
        this.handleGenerateScript()
      }
    })
  }

  private editFuncArgs = ({funcs, funcID, key, value}): Func[] => {
    return funcs.map(f => {
      if (f.id !== funcID) {
        return f
      }

      const args = f.args.map(a => {
        if (a.key === key) {
          return {...a, value}
        }

        return a
      })

      return {...f, args}
    })
  }

  private get bodyToScript(): string {
    return getBodyToScript(this.state.body)
  }

  private handleAppendFrom = (): void => {
    const {script} = this.props
    let newScript = script.trim()
    const from = builder.NEW_FROM

    if (!newScript) {
      this.getASTResponse(from)
      return
    }

    newScript = `${script.trim()}\n\n${from}\n\n`
    this.getASTResponse(newScript)
  }

  private handleAppendJoin = (): void => {
    const {script} = this.props
    const newScript = appendJoin(script)

    this.getASTResponse(newScript)
  }

  private handleChangeScript = (script: string): void => {
    this.debouncedASTResponse(script)
    this.props.updateScript(script)
  }

  private handleAddNode = (
    name: string,
    bodyID: string,
    declarationID: string
  ): void => {
    const script = addNode(name, bodyID, declarationID, this.state.body)

    this.getASTResponse(script)
  }

  private handleDeleteBody = (bodyID: string): void => {
    const script = deleteBody(bodyID, this.state.body)
    this.getASTResponse(script)
  }

  private handleScriptUpToYield = (
    bodyID: string,
    declarationID: string,
    funcNodeIndex: number,
    isYieldable: boolean
  ): string => {
    return scriptUpToYield(
      bodyID,
      declarationID,
      funcNodeIndex,
      isYieldable,
      this.state.body
    )
  }

  private handleToggleYield = (
    bodyID: string,
    declarationID: string,
    funcNodeIndex: number
  ): void => {
    const script = toggleYield(
      bodyID,
      declarationID,
      funcNodeIndex,
      this.state.body
    )

    this.getASTResponse(script)
  }

  private handleDeleteFuncNode = (ids: DeleteFuncNodeArgs): void => {
    const script = deleteFuncNode(ids, this.state.body)

    this.getASTResponse(script)
  }

  private handleValidate = async () => {
    const {links, notify, script} = this.props

    try {
      const ast = await getAST({url: links.ast, body: script})
      const body = bodyNodes(ast, this.state.suggestions)
      const status = {type: 'success', text: ''}
      notify(validateSuccess())

      this.setState({ast, body, status})
    } catch (error) {
      this.setState({status: parseError(error)})
      return console.error('Could not parse AST', error)
    }
  }

  private getASTResponse = async (script: string, update: boolean = true) => {
    const {links} = this.props

    if (!script) {
      this.props.updateScript(script)
      return this.setState({ast: emptyAST, body: []})
    }

    try {
      const ast = await getAST({url: links.ast, body: script})

      if (update) {
        this.props.updateScript(script)
      }

      const body = bodyNodes(ast, this.state.suggestions)
      const status = {type: 'success', text: ''}
      this.setState({ast, body, status})
    } catch (error) {
      this.setState({status: parseError(error)})
      return console.error('Could not parse AST', error)
    }
  }

  private getTimeSeries = async () => {
    const {script, service, links, notify} = this.props

    if (!script) {
      return
    }

    try {
      await getAST({url: links.ast, body: script})
    } catch (error) {
      this.setState({status: parseError(error)})
      return console.error('Could not parse AST', error)
    }

    try {
      const {tables, didTruncate} = await getTimeSeries(service, script)

      this.setState({data: tables})

      if (didTruncate) {
        notify(fluxResponseTruncatedError())
      }
    } catch (error) {
      this.setState({data: []})

      notify(fluxTimeSeriesError(error))
      console.error('Could not get timeSeries', error)
    }

    this.getASTResponse(script)
  }
}

export default FluxPage
