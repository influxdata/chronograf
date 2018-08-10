import React, {PureComponent} from 'react'

import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import AnnotationEditorForm from 'src/shared/components/AnnotationEditorForm'

import {Annotation, RemoteDataState} from 'src/types'

const OVERLAY_WIDTH = 600

interface Props {
  annotation: Annotation
  onCancel: () => void
  onSave: (annotation: Annotation) => Promise<void>
  onDelete: () => Promise<void>
}

interface State {
  draftAnnotation: Annotation | null
  savingStatus: RemoteDataState
}

class AnnotationEditor extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      draftAnnotation: null,
      savingStatus: RemoteDataState.NotStarted,
    }
  }

  public render() {
    const {annotation, onDelete, onCancel} = this.props

    return (
      <div className="annotation-editor">
        <OverlayContainer maxWidth={OVERLAY_WIDTH}>
          <OverlayHeading title={'Edit Annotation'}>
            <div className="annotation-editor--controls">
              <button className="btn btn-sm btn-default" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn btn-sm btn-success"
                disabled={!this.canSave || this.isSaving}
                onClick={this.handleSave}
                data-test="save-button"
              >
                {this.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </OverlayHeading>
          <OverlayBody>
            <AnnotationEditorForm
              key={annotation.id}
              annotation={annotation}
              onSetDraftAnnotation={this.handleSetDraftAnnotation}
              onDelete={onDelete}
            />
          </OverlayBody>
        </OverlayContainer>
      </div>
    )
  }

  private get canSave(): boolean {
    return !!this.state.draftAnnotation
  }

  private get isSaving(): boolean {
    return this.state.savingStatus === RemoteDataState.Loading
  }

  private handleSetDraftAnnotation = (
    draftAnnotation: Annotation | null
  ): void => {
    this.setState({draftAnnotation})
  }

  private handleSave = async (): Promise<void> => {
    if (!this.canSave) {
      return
    }

    const {onSave} = this.props
    const {draftAnnotation} = this.state

    this.setState({savingStatus: RemoteDataState.Loading})

    await onSave(draftAnnotation)
  }
}

export default AnnotationEditor
