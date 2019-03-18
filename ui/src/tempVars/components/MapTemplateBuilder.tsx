import React, {PureComponent, ChangeEvent} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {csvToMap, mapToCSV} from 'src/tempVars/utils'
import TemplatePreviewList from 'src/tempVars/components/TemplatePreviewList'
import DragAndDrop from 'src/shared/components/DragAndDrop'
import {
  notifyCSVUploadFailed,
  notifyInvalidMapType,
} from 'src/shared/copy/notifications'

import {TemplateBuilderProps} from 'src/types'

interface State {
  templateValuesString: string
}

@ErrorHandling
class MapTemplateBuilder extends PureComponent<TemplateBuilderProps, State> {
  public constructor(props: TemplateBuilderProps) {
    super(props)
    const templateValuesString = mapToCSV(props.template.values)

    this.state = {
      templateValuesString,
    }
  }

  public render() {
    const {onUpdateDefaultTemplateValue, template} = this.props
    const {templateValuesString} = this.state

    return (
      <>
        <div className="form-group col-xs-12">
          <label>Upload a CSV File</label>
          <DragAndDrop
            submitText="Preview"
            fileTypesToAccept={this.validFileExtension}
            handleSubmit={this.handleUploadFile}
            submitOnDrop={true}
            submitOnUpload={true}
            compact={true}
          />
        </div>
        <div className="form-group col-xs-12">
          <label>Comma Separated Values</label>
          <div className="temp-builder--mq-controls">
            <textarea
              className="form-control input-sm"
              value={templateValuesString}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
            />
          </div>
        </div>
        <div className="form-group col-xs-12 temp-builder--results">
          <p className="temp-builder--validation">
            Mapping contains <strong>{template.values.length}</strong> key-value
            pair{this.pluralizer}
          </p>
          {template.values.length > 0 && (
            <TemplatePreviewList
              items={template.values}
              onUpdateDefaultTemplateValue={onUpdateDefaultTemplateValue}
            />
          )}
        </div>
      </>
    )
  }

  private get pluralizer(): string {
    return this.props.template.values.length === 1 ? '' : 's'
  }

  private handleUploadFile = (
    uploadContent: string,
    fileName: string
  ): void => {
    const {template, onUpdateTemplate} = this.props

    const fileExtensionRegex = new RegExp(`${this.validFileExtension}$`)
    if (!fileName.match(fileExtensionRegex)) {
      this.props.notify(notifyCSVUploadFailed())
      return
    }

    this.setState({templateValuesString: uploadContent})

    const nextValues = this.constructValuesFromString(uploadContent)

    onUpdateTemplate({...template, values: nextValues})
  }

  private handleBlur = (): void => {
    const {template, onUpdateTemplate} = this.props
    const {templateValuesString} = this.state

    const values = this.constructValuesFromString(templateValuesString)

    onUpdateTemplate({...template, values})
  }

  private get validFileExtension(): string {
    return '.csv'
  }

  private handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    this.setState({templateValuesString: e.target.value})
  }

  private constructValuesFromString(templateValuesString: string) {
    const {notify} = this.props

    const {errors, values} = csvToMap(templateValuesString)

    if (errors.length > 0) {
      notify(notifyInvalidMapType())
    }

    return values
  }
}

export default MapTemplateBuilder
