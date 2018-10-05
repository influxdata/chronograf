// Libraries
import React, {PureComponent} from 'react'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import TimeMachineEditor from 'src/flux/components/TimeMachineEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import {
  Button,
  ComponentSize,
  ComponentColor,
  ComponentStatus,
} from 'src/reusable_ui'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'
import {emptyAST} from 'src/flux/constants'

// Utils
import {getSuggestions, getAST} from 'src/flux/apis'
import Restarter from 'src/shared/utils/Restarter'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {parseError} from 'src/flux/helpers/scriptBuilder'

// Types
import {NotificationAction, Source} from 'src/types'
import {Suggestion, Links, ScriptStatus} from 'src/types/flux'

const AST_DEBOUNCE_DELAY = 600

interface Props {
  script: string
  onChangeScript: (script: string) => void
  source: Source
  onUpdateStatus?: (status: ScriptStatus) => void
  links: Links
  notify: NotificationAction
}

interface State {
  suggestions: Suggestion[]
  draftScript: string
  draftScriptStatus: ScriptStatus
  ast: object
  hasChangedScript: boolean
}

class FluxQueryMaker extends PureComponent<Props, State> {
  private restarter: Restarter = new Restarter()
  private debouncer: Debouncer = new DefaultDebouncer()

  public constructor(props: Props) {
    super(props)

    this.state = {
      suggestions: [],
      ast: {},
      draftScript: props.script,
      draftScriptStatus: {type: 'none', text: ''},
      hasChangedScript: false,
    }
  }

  public componentDidMount() {
    this.fetchSuggestions()
    this.updateBody()
  }

  public render() {
    const {notify, source} = this.props
    const {
      suggestions,
      draftScript,
      draftScriptStatus,
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
        hasChangedScript: true,
      },
      () => this.debouncer.call(this.updateBody, AST_DEBOUNCE_DELAY)
    )
  }

  private updateBody = async () => {
    const {draftScript} = this.state

    let ast: object
    let draftScriptStatus: ScriptStatus

    try {
      ast = await this.restarter.perform(
        getAST({url: this.props.links.ast, body: draftScript})
      )

      draftScriptStatus = {type: 'success', text: ''}
    } catch (error) {
      ast = emptyAST
      draftScriptStatus = parseError(error)
    }

    this.setState({
      ast,
      draftScriptStatus,
    })
  }

  private fetchSuggestions = async (): Promise<void> => {
    const {links} = this.props
    const suggestions = await getSuggestions(links.suggestions)

    this.setState({suggestions})
  }
}

export default FluxQueryMaker
