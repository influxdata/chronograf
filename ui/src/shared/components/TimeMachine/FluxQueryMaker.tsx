// Libraries
import React, {PureComponent} from 'react'
import {Position} from 'codemirror'

// Components
import SchemaExplorer from 'src/flux/components/SchemaExplorer'
import FluxEditor from 'src/flux/components/FluxEditor'
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import {Button, ComponentSize, ComponentColor} from 'src/reusable_ui'
import FluxFunctionsToolbar from 'src/flux/components/flux_functions_toolbar/FluxFunctionsToolbar'

// Constants
import {HANDLE_VERTICAL} from 'src/shared/constants'

// Utils
import {getAST} from 'src/shared/apis/flux/ast'
import {restartable} from 'src/shared/utils/restartable'
import DefaultDebouncer, {Debouncer} from 'src/shared/utils/debouncer'
import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'
import {parseError} from 'src/flux/helpers/scriptBuilder'
import {getSuggestions} from 'src/flux/helpers/suggestions'
import {insertFluxFunction} from 'src/flux/helpers/scriptInsertion'

// Types
import {NotificationAction, Source} from 'src/types'
import {
  Suggestion,
  Links,
  ScriptStatus,
  FluxToolbarFunction,
} from 'src/types/flux'
import FluxQueryBuilder from './fluxQueryBuilder/FluxQueryBuilder'

const CHECK_SCRIPT_DELAY = 600
const VALID_SCRIPT_STATUS = {type: 'success', text: ''}

interface ConnectedProps {
  fluxProportions: number[]
  onSetFluxProportions: (fluxProportions: number[]) => void
}

interface PassedProps {
  script: string
  draftScript: string
  onChangeScript: (script: string) => void
  onChangeDraftScript: (draftScript: string) => void
  source: Source
  onManualRefresh: () => void
  onUpdateStatus?: (status: ScriptStatus) => void
  links: Links
  notify: NotificationAction
}

type Props = ConnectedProps & PassedProps

interface State {
  suggestions: Suggestion[]
  draftScriptStatus: ScriptStatus
  isWizardActive: boolean
}

class FluxQueryMaker extends PureComponent<Props, State> {
  private debouncer: Debouncer = new DefaultDebouncer()
  private getAST = restartable(getAST)
  private cursorPosition: Position = {line: 0, ch: 0}

  public constructor(props: Props) {
    super(props)

    this.state = {
      suggestions: getSuggestions(),
      draftScriptStatus: {type: 'none', text: ''},
      isWizardActive: false,
    }
  }

  public componentDidMount() {
    this.checkDraftScript()
  }

  public render() {
    const {
      notify,
      source,
      draftScript,
      fluxProportions,
      onSetFluxProportions,
    } = this.props
    if (!this.state.isWizardActive) {
      const {suggestions, draftScriptStatus} = this.state
      const [leftSize, middleSize, rightSize] = fluxProportions
      const divisions = [
        {
          name: 'Schema',
          size: leftSize,
          headerButtons: [],
          menuOptions: [],
          render: () => <SchemaExplorer source={source} notify={notify} />,
          headerOrientation: HANDLE_VERTICAL,
        },
        {
          name: 'Script',
          size: middleSize,
          customClass: 'flux-query-maker--script',
          headerOrientation: HANDLE_VERTICAL,
          headerButtons: [
            <Button
              key={0}
              text={'Script Wizard'}
              onClick={this.handleShowWizard}
              size={ComponentSize.ExtraSmall}
            />,
            <Button
              key={1}
              text={'Run Script'}
              onClick={this.handleSubmitScript}
              size={ComponentSize.ExtraSmall}
              color={ComponentColor.Primary}
            />,
          ],
          menuOptions: [],
          render: visibility => (
            <FluxEditor
              status={draftScriptStatus}
              script={draftScript}
              visibility={visibility}
              suggestions={suggestions}
              onChangeScript={this.handleChangeDraftScript}
              onSubmitScript={this.handleSubmitScript}
              onShowWizard={this.handleShowWizard}
              onCursorChange={this.handleCursorPosition}
            />
          ),
        },
        {
          name: 'Flux Functions',
          size: rightSize,
          headerButtons: [],
          menuOptions: [],
          render: () => (
            <FluxFunctionsToolbar
              onInsertFluxFunction={this.handleInsertFluxFunction}
            />
          ),
          headerOrientation: HANDLE_VERTICAL,
        },
      ]
      return (
        <div className="flux-script-wizard">
          <div className="flux-script-wizard--children">
            <Threesizer
              orientation={HANDLE_VERTICAL}
              divisions={divisions}
              containerClass="page-contents"
              onResize={onSetFluxProportions}
            />
          </div>
        </div>
      )
    }

    return <FluxQueryBuilder source={source} />
  }

  private handleCursorPosition = (position: Position): void => {
    this.cursorPosition = position
  }

  private handleInsertFluxFunction = async (
    fluxFunction: FluxToolbarFunction
  ): Promise<void> => {
    const {draftScript} = this.props
    const {line} = this.cursorPosition

    const {updatedScript, cursorPosition} = insertFluxFunction(
      line,
      draftScript,
      fluxFunction
    )
    await this.handleChangeDraftScript(updatedScript)

    this.handleCursorPosition(cursorPosition)
  }

  private handleSubmitScript = () => {
    const {
      onChangeScript,
      onUpdateStatus,
      onManualRefresh,
      draftScript,
    } = this.props
    const {draftScriptStatus} = this.state

    onChangeScript(draftScript)
    onManualRefresh()

    if (onUpdateStatus) {
      onUpdateStatus(draftScriptStatus)
    }
  }

  private handleShowWizard = (): void => {
    this.handleSetIsWizardActive(true)
  }

  private handleSetIsWizardActive = (isWizardActive: boolean): void => {
    this.setState({isWizardActive})
  }

  private handleChangeDraftScript = async (
    draftScript: string
  ): Promise<void> => {
    const {onChangeDraftScript} = this.props

    await onChangeDraftScript(draftScript)
    this.debouncer.call(this.checkDraftScript, CHECK_SCRIPT_DELAY)
  }

  private checkDraftScript = async () => {
    const {draftScript} = this.props

    if (draftScript.trim() === '') {
      // Don't attempt to validate an empty script
      this.setState({draftScriptStatus: VALID_SCRIPT_STATUS})

      return
    }

    let draftScriptStatus: ScriptStatus

    try {
      await this.getAST({url: this.props.links.ast, body: draftScript})

      draftScriptStatus = VALID_SCRIPT_STATUS
    } catch (error) {
      draftScriptStatus = parseError(error)
    }

    this.setState({draftScriptStatus})
  }
}

const ConnectedFluxQueryMaker = (props: PassedProps) => (
  <TimeMachineContextConsumer>
    {(container: TimeMachineContainer) => (
      <FluxQueryMaker
        {...props}
        fluxProportions={container.state.fluxProportions}
        onSetFluxProportions={container.handleSetFluxProportions}
      />
    )}
  </TimeMachineContextConsumer>
)

export default ConnectedFluxQueryMaker
