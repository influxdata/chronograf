import React, {Component} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

import TemplateControl from 'src/tempVars/components/TemplateControl'
import OverlayTechnology from 'src/reusable_ui/components/overlays/OverlayTechnology'
import TemplateVariableEditor from 'src/tempVars/components/TemplateVariableEditor'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {graphFromTemplates} from 'src/tempVars/utils/graph'

import {Template, TemplateValue, Source} from 'src/types'

interface Props {
  meRole: string
  isUsingAuth: boolean
  templates: Template[]
  source: Source
  onPickTemplate: (template: Template, value: TemplateValue) => void
  onSaveTemplates: (templates: Template[]) => void
}

interface State {
  isAdding: boolean
}

@ErrorHandling
class TemplateControlBar extends Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {isAdding: false}
  }

  public render() {
    const {templates, source} = this.props
    const {isAdding} = this.state

    return (
      <div className="template-control-bar">
        <div className="template-control--container">
          <div className="template-control--controls">
            {this.renderTemplateControls()}
            <OverlayTechnology visible={isAdding}>
              <TemplateVariableEditor
                templates={templates}
                source={source}
                onCreate={this.handleCreateTemplate}
                onCancel={this.handleCancelAddVariable}
              />
            </OverlayTechnology>
          </div>
          <Authorized requiredRole={EDITOR_ROLE}>
            <button
              className="btn btn-primary btn-sm template-control--manage"
              data-test="add-template-variable"
              onClick={this.handleAddVariable}
            >
              <span className="icon plus" />
              Add Template Variable
            </button>
          </Authorized>
        </div>
      </div>
    )
  }

  public renderTemplateControls() {
    const {templates, onPickTemplate, meRole, isUsingAuth, source} = this.props

    if (!templates || !templates.length) {
      return (
        <div className="template-control--empty" data-test="empty-state">
          This dashboard does not have any <strong>Template Variables</strong>
        </div>
      )
    }

    return templates.map(template => {
      const onPickValue = v => onPickTemplate(template, v)

      return (
        <TemplateControl
          key={template.id}
          meRole={meRole}
          isUsingAuth={isUsingAuth}
          template={template}
          templates={templates}
          source={source}
          onPickValue={onPickValue}
          onCreateTemplate={this.handleCreateTemplate}
          onUpdateTemplate={this.handleUpdateTemplate}
          onDeleteTemplate={this.handleDeleteTemplate}
        />
      )
    })
  }

  private handleAddVariable = (): void => {
    this.setState({isAdding: true})
  }

  private handleCancelAddVariable = (): void => {
    this.setState({isAdding: false})
  }

  private handleCreateTemplate = async (template: Template): Promise<void> => {
    const {templates, onSaveTemplates} = this.props
    const newTemplates = [...templates, template]

    // Verify adding template yields a valid template graph (will throw if not)
    graphFromTemplates(newTemplates)

    await onSaveTemplates(newTemplates)

    this.setState({isAdding: false})
  }

  private handleUpdateTemplate = async (template: Template): Promise<void> => {
    const {templates, onSaveTemplates} = this.props
    const newTemplates = templates.reduce((acc, t) => {
      if (t.id === template.id) {
        return [...acc, template]
      }

      return [...acc, t]
    }, [])

    // Verify update yields a valid template graph (will throw if not)
    graphFromTemplates(newTemplates)

    await onSaveTemplates(newTemplates)
  }

  private handleDeleteTemplate = async (template: Template): Promise<void> => {
    const {templates, onSaveTemplates} = this.props
    const newTemplates = templates.filter(t => t.id !== template.id)

    await onSaveTemplates(newTemplates)
  }
}

export default TemplateControlBar
