import React, {PureComponent, ChangeEvent} from 'react'
import _ from 'lodash'
import {getDeep} from 'src/utils/wrappers'

import {ErrorHandling} from 'src/shared/decorators/errors'
import TemplateFluxScriptPreview from './TemplateFluxQueryPreview'
import {hydrateTemplate} from 'src/tempVars/utils/graph'

import {TemplateBuilderProps, RemoteDataState} from 'src/types'

const DEBOUNCE_DELAY = 750

interface State {
  fluxScriptInput: string // bound to input
  fluxScript: string // debounced view of fluxScriptInput
  fluxScriptResultsStatus: RemoteDataState
  fluxScriptWarning?: string
}

@ErrorHandling
class FluxQueryTemplateBuilder extends PureComponent<
  TemplateBuilderProps,
  State
> {
  private handleFluxScriptChange: () => void = _.debounce(() => {
    const {fluxScript, fluxScriptInput} = this.state

    if (fluxScript === fluxScriptInput) {
      return
    }

    this.setState({fluxScript: fluxScriptInput}, this.executeQuery)
  }, DEBOUNCE_DELAY)

  constructor(props: TemplateBuilderProps) {
    super(props)

    const fluxScript = getDeep<string>(props.template, 'query.flux', '')

    this.state = {
      fluxScript,
      fluxScriptInput: fluxScript,
      fluxScriptResultsStatus: RemoteDataState.NotStarted,
    }
  }

  public componentDidMount() {
    this.executeQuery()
  }

  public render() {
    const {fluxScriptInput} = this.state

    return (
      <>
        <div className="form-group col-xs-12">
          <label>Flux Script</label>
          <div className="temp-builder--mq-controls ">
            <textarea
              className="form-control input-sm temp-builder--flux"
              value={fluxScriptInput}
              onChange={this.handleFluxScriptInputChange}
              onBlur={this.handleFluxScriptChange}
            />
          </div>
        </div>
        {this.renderResults()}
      </>
    )
  }

  private renderResults() {
    const {template, onUpdateDefaultTemplateValue, source} = this.props
    const {fluxScriptResultsStatus, fluxScriptWarning} = this.state

    if (!source.links.flux) {
      return (
        <div className="form-group col-xs-12 temp-builder--results">
          <p className="temp-builder--validation error">
            The current source does not support flux.
          </p>
        </div>
      )
    }

    return (
      <TemplateFluxScriptPreview
        items={template.values}
        loadingStatus={fluxScriptResultsStatus}
        fluxScriptWarning={fluxScriptWarning}
        onUpdateDefaultTemplateValue={onUpdateDefaultTemplateValue}
      />
    )
  }

  private handleFluxScriptInputChange = (
    e: ChangeEvent<HTMLTextAreaElement>
  ) => {
    this.setState({fluxScriptInput: e.target.value})
    this.handleFluxScriptChange()
  }

  private executeQuery = async (): Promise<void> => {
    const {template, templates, source, onUpdateTemplate} = this.props
    const {fluxScript} = this.state

    if (fluxScript === '' || !source.links.flux) {
      return
    }

    this.setState({fluxScriptResultsStatus: RemoteDataState.Loading})

    try {
      const templateWithQuery = {
        ...template,
        query: {flux: fluxScript},
      }
      let warning: string | undefined
      const warnFn = (msg: string) => {
        if (!warning) {
          warning = msg
        }
      }
      const nextTemplate = await hydrateTemplate(templateWithQuery, templates, {
        source,
        warnFn,
      })

      this.setState({
        fluxScriptResultsStatus: RemoteDataState.Done,
        fluxScriptWarning: warning,
      })

      if (nextTemplate.values[0]) {
        nextTemplate.values[0].selected = true
      }

      onUpdateTemplate(nextTemplate)
    } catch (e) {
      console.error(e)
      this.setState({
        fluxScriptResultsStatus: RemoteDataState.Error,
      })
    }
  }
}

export default FluxQueryTemplateBuilder
