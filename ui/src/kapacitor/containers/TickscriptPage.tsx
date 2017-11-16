import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators, compose} from 'redux'
import {History} from 'history'
import {withRouter} from 'react-router-dom'

import Tickscript from 'kapacitor/components/Tickscript'
import * as kapacitorActionCreators from 'kapacitor/actions/view'
import * as errorActionCreators from 'shared/actions/errors'
import {getActiveKapacitor} from 'shared/apis'

import {Kapacitor, RouterRuleID, Rule, Source, Task} from 'src/types'

export interface TickscriptPageProps {
  source: Source
  errorActions: {
    errorThrown: typeof errorActionCreators.errorThrown
  }
  kapacitorActions: {
    updateTask: typeof kapacitorActionCreators.updateTask
    createTask: typeof kapacitorActionCreators.createTask
    getRule: typeof kapacitorActionCreators.getRule
  }
  history: History
  rules: Rule[]
}

export interface TickscriptPageState {
  kapacitor: Kapacitor
  task: Task
  validation: string
  isEditingID: boolean
}

class TickscriptPage extends React.Component<
  TickscriptPageProps & RouterRuleID,
  TickscriptPageState
> {
  public state = {
    kapacitor: {},
    task: {
      id: '',
      name: '',
      status: 'enabled',
      tickscript: '',
      dbrps: [],
      type: 'stream',
    },
    validation: '',
    isEditingID: true,
  }

  private handleSave = async () => {
    const {kapacitor, task} = this.state
    const {
      source: {id: sourceID},
      history,
      kapacitorActions: {createTask, updateTask},
      match: {params: {ruleID}},
    } = this.props

    let response

    try {
      if (this._isEditing()) {
        response = await updateTask(kapacitor, task, ruleID, history, sourceID)
      } else {
        response = await createTask(kapacitor, task, history, sourceID)
      }

      if (response && response.code === 500) {
        return this.setState({validation: response.message})
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  private handleChangeScript = tickscript => {
    this.setState({task: {...this.state.task, tickscript}})
  }

  private handleSelectDbrps = dbrps => {
    this.setState({task: {...this.state.task, dbrps}})
  }

  private handleChangeType = type => () => {
    this.setState({task: {...this.state.task, type}})
  }

  private handleChangeID = e => {
    this.setState({task: {...this.state.task, id: e.target.value}})
  }

  private _isEditing() {
    const {match} = this.props
    return match.params.ruleID && match.params.ruleID !== 'new'
  }

  public async componentDidMount() {
    const {
      source,
      errorActions,
      kapacitorActions,
      match: {params: {ruleID}},
    } = this.props

    const kapacitor = await getActiveKapacitor(source)
    if (!kapacitor) {
      errorActions.errorThrown(
        'We could not find a configured Kapacitor for this source'
      )
    }

    if (this._isEditing()) {
      await kapacitorActions.getRule(kapacitor, ruleID)
      const {id, name, tickscript, dbrps, type} = this.props.rules.find(
        r => r.id === ruleID
      )

      this.setState({task: {tickscript, dbrps, type, status, name, id}})
    }

    this.setState({kapacitor})
  }

  public render() {
    const {source} = this.props
    const {task, validation} = this.state

    return (
      <Tickscript
        task={task}
        source={source}
        validation={validation}
        onSave={this.handleSave}
        isNewTickscript={!this._isEditing()}
        onSelectDbrps={this.handleSelectDbrps}
        onChangeScript={this.handleChangeScript}
        onChangeType={this.handleChangeType}
        onChangeID={this.handleChangeID}
      />
    )
  }
}

const mapStateToProps = state => {
  return {
    rules: Object.values(state.rules),
  }
}

const mapDispatchToProps = dispatch => ({
  kapacitorActions: bindActionCreators(kapacitorActionCreators, dispatch),
  errorActions: bindActionCreators(errorActionCreators, dispatch),
})

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TickscriptPage)
