// Libraries
import React, {PureComponent} from 'react'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import BodyBuilder from 'src/flux/components/BodyBuilder'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import {
  Button,
  ComponentSize,
  ComponentColor,
  ComponentStatus,
} from 'src/reusable_ui'
import Spinner from 'src/shared/components/Spinner'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'
import {emptyAST} from 'src/flux/constants'

// Utils
import {bodyNodes} from 'src/flux/helpers'
import {getSuggestions, getAST} from 'src/flux/apis'
import {builder} from 'src/flux/constants'
import Restarter from 'src/shared/utils/Restarter'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {
  addNode,
  parseError,
  deleteBody,
  appendJoin,
  toggleYield,
  deleteFuncNode,
  getBodyToScript,
  changeArg,
} from 'src/flux/helpers/scriptBuilder'

// Types
import {
  NotificationAction,
  Source,
  Query,
  TimeRange,
  RemoteDataState,
} from 'src/types'
import {
  Suggestion,
  FlatBody,
  Links,
  InputArg,
  DeleteFuncNodeArgs,
  ScriptStatus,
} from 'src/types/flux'

const AST_DEBOUNCE_DELAY = 600

interface Body extends FlatBody {
  id: string
}

interface Props {
  script: string
  onChangeScript: (script: string) => void
  source: Source
  onUpdateStatus?: (status: ScriptStatus) => void
  links: Links
  notify: NotificationAction
  queries: Query[]
  timeRange: TimeRange
}

interface State {
  suggestions: Suggestion[]
  draftScript: string
  draftScriptStatus: ScriptStatus
  body: Body[]
  bodyStatus: RemoteDataState
  ast: object
  wasFuncSelectorClicked: boolean
  hasChangedScript: boolean
}

class FluxQueryMaker extends PureComponent<Props, State> {
  private restarter: Restarter = new Restarter()
  private debouncer: Debouncer = new DefaultDebouncer()

  public constructor(props: Props) {
    super(props)

    this.state = {
      suggestions: [],
      body: [],
      bodyStatus: RemoteDataState.NotStarted,
      ast: {},
      draftScript: props.script,
      draftScriptStatus: {type: 'none', text: ''},
      wasFuncSelectorClicked: false,
      hasChangedScript: false,
    }
  }

  public componentDidMount() {
    this.fetchSuggestions()
    this.updateBody()
  }

  public render() {
    const {notify, source, queries, timeRange} = this.props
    const {
      body,
      bodyStatus,
      suggestions,
      draftScript,
      draftScriptStatus,
      wasFuncSelectorClicked,
      hasChangedScript,
    } = this.state

    const submitStatus = hasChangedScript
      ? ComponentStatus.Default
      : ComponentStatus.Disabled

    const divisions = [
      {
        name: 'Script',
        headerOrientation: HANDLE_VERTICAL,
        headerButtons: [
          <Button
            key={0}
            text={'Submit'}
            titleText={'Submit Flux Query (Ctrl-Enter)'}
            onClick={this.handleSubmitScript}
            size={ComponentSize.ExtraSmall}
            color={ComponentColor.Primary}
            status={submitStatus}
          />,
        ],
        menuOptions: [],
        render: visibility => (
          <TimeMachineEditor
            setWasFuncSelectorClicked={this.handleSetWasFuncSelectorClicked}
            status={draftScriptStatus}
            script={draftScript}
            visibility={visibility}
            suggestions={suggestions}
            onChangeScript={this.handleChangeDraftScript}
            onSubmitScript={this.handleSubmitScript}
          />
        ),
      },
      {
        name: 'Build',
        headerButtons: [<Spinner key={0} status={bodyStatus} />],
        menuOptions: [],
        render: () => (
          <BodyBuilder
            body={body}
            wasFuncSelectorClicked={wasFuncSelectorClicked}
            setWasFuncSelectorClicked={this.handleSetWasFuncSelectorClicked}
            suggestions={suggestions}
            onDeleteBody={this.handleDeleteBody}
            onAppendFrom={this.handleAppendFrom}
            onAppendJoin={this.handleAppendJoin}
            onDeleteFuncNode={this.handleDeleteFuncNode}
            onAddNode={this.handleAddNode}
            onChangeArg={this.handleChangeArg}
            onGenerateScript={this.handleGenerateScript}
            onToggleYield={this.handleToggleYield}
            data={[]}
            source={source}
            queries={queries}
            timeRange={timeRange}
          />
        ),
      },
      {
        name: 'Explore',
        headerButtons: [],
        menuOptions: [],
        render: () => <SchemaExplorer source={source} notify={notify} />,
        headerOrientation: HANDLE_VERTICAL,
      },
    ]

    return (
      <Threesizer
        orientation={HANDLE_VERTICAL}
        divisions={divisions}
        containerClass="page-contents"
      />
    )
  }

  private handleSubmitScript = () => {
    const {onChangeScript, onUpdateStatus} = this.props
    const {draftScript, draftScriptStatus} = this.state

    onChangeScript(draftScript)

    if (onUpdateStatus) {
      onUpdateStatus(draftScriptStatus)
    }

    this.setState({hasChangedScript: false})
  }

  private handleChangeDraftScript = async (
    draftScript: string
  ): Promise<void> => {
    this.setState(
      {
        draftScript,
        bodyStatus: RemoteDataState.Loading,
        hasChangedScript: true,
      },
      () => this.debouncer.call(this.updateBody, AST_DEBOUNCE_DELAY)
    )
  }

  private updateBody = async () => {
    const {draftScript} = this.state

    let ast: object
    let draftScriptStatus: ScriptStatus
    let bodyStatus

    try {
      ast = await this.restarter.perform(
        getAST({url: this.props.links.ast, body: draftScript})
      )

      draftScriptStatus = {type: 'success', text: ''}
      bodyStatus = RemoteDataState.Done
    } catch (error) {
      ast = emptyAST
      draftScriptStatus = parseError(error)
      bodyStatus = RemoteDataState.Error
    }

    this.setState({
      ast,
      bodyStatus,
      draftScriptStatus,
      body: bodyNodes(ast, this.state.suggestions),
    })
  }

  private handleGenerateScript = (): void => {
    this.handleChangeDraftScript(getBodyToScript(this.state.body))
  }

  private handleChangeArg = (input: InputArg): void => {
    const {body} = this.state
    const newBody = changeArg(input, body)

    this.setState({body: newBody})
    this.handleChangeDraftScript(getBodyToScript(newBody))
  }

  private handleAppendFrom = (): void => {
    const {source} = this.props
    const {draftScript} = this.state

    const from = builder.getNewFromScript(source.telegraf, source.defaultRP)

    let newScript

    if (!draftScript.trim()) {
      newScript = from
    } else {
      newScript = `${draftScript.trim()}\n\n${from}\n\n`
    }

    this.handleChangeDraftScript(newScript)
  }

  private handleAppendJoin = (): void => {
    const {draftScript} = this.state
    const newScript = appendJoin(draftScript)

    this.handleChangeDraftScript(newScript)
  }

  private handleAddNode = (
    name: string,
    bodyID: string,
    declarationID: string
  ): void => {
    const newScript = addNode(name, bodyID, declarationID, this.state.body)

    this.handleChangeDraftScript(newScript)
  }

  private handleDeleteBody = (bodyID: string): void => {
    const newScript = deleteBody(bodyID, this.state.body)

    this.handleChangeDraftScript(newScript)
  }

  private handleToggleYield = (
    bodyID: string,
    declarationID: string,
    funcNodeIndex: number
  ): void => {
    const newScript = toggleYield(
      bodyID,
      declarationID,
      funcNodeIndex,
      this.state.body
    )

    this.handleChangeDraftScript(newScript)
  }

  private handleDeleteFuncNode = (ids: DeleteFuncNodeArgs): void => {
    const newScript = deleteFuncNode(ids, this.state.body)

    this.handleChangeDraftScript(newScript)
  }

  private handleSetWasFuncSelectorClicked = (val: boolean) => {
    this.setState({wasFuncSelectorClicked: val})
  }

  private fetchSuggestions = async (): Promise<void> => {
    const {links} = this.props
    const suggestions = await getSuggestions(links.suggestions)

    this.setState({suggestions})
  }
}

export default FluxQueryMaker
