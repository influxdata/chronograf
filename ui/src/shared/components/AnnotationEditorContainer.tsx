import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import AnnotationEditor from 'src/shared/components/AnnotationEditor'

import {
  setEditingAnnotation,
  updateAnnotationAsync,
  deleteAnnotationAsync,
  setTagKeys as setTagKeysAction,
} from 'src/shared/actions/annotations'
import {notify} from 'src/shared/actions/notifications'
import {notifyErrorWithAltText} from 'src/shared/copy/notifications'

import {Annotation} from 'src/types'

interface Props {
  editingAnnotation?: Annotation
  onSetEditingAnnotation: typeof setEditingAnnotation
  onDeleteAnnotation: typeof deleteAnnotationAsync
  onSaveAnnotation: typeof updateAnnotationAsync
  setTagKeys: typeof setTagKeysAction
  onNotify: typeof notify
}

class AnnotationEditorContainer extends PureComponent<Props> {
  public render() {
    const {editingAnnotation} = this.props

    if (!editingAnnotation) {
      return null
    }

    return (
      <div className="overlay-tech show">
        <div className="overlay--dialog" data-test="overlay-children">
          <AnnotationEditor
            annotation={editingAnnotation}
            onCancel={this.handleCancelEdits}
            onSave={this.handleSave}
            onDelete={this.handleDelete}
          />
        </div>
        <div className="overlay--mask" />
      </div>
    )
  }

  private handleCancelEdits = (): void => {
    const {onSetEditingAnnotation} = this.props

    onSetEditingAnnotation(null)
  }

  private handleDelete = async (): Promise<void> => {
    const {editingAnnotation, onDeleteAnnotation} = this.props

    await onDeleteAnnotation(editingAnnotation)
  }

  private handleSave = async (a: Annotation): Promise<void> => {
    const {
      onSaveAnnotation,
      onSetEditingAnnotation,
      onNotify,
      setTagKeys,
    } = this.props

    try {
      await onSaveAnnotation(a)
      setTagKeys(null)

      onSetEditingAnnotation(null)
    } catch (e) {
      let errorMessage = 'unknown error'

      if (e.status && e.status === 404) {
        errorMessage = 'annotation not found'
      } else if (e.status && e.status === 422) {
        errorMessage = 'could not process annotation'
      }

      onNotify(
        notifyErrorWithAltText(
          'error',
          `Could not save annotation: ${errorMessage}`
        )
      )
    }
  }
}

const mstp = ({annotations: {annotations, editingAnnotation}}) => {
  return {
    editingAnnotation: annotations[editingAnnotation],
  }
}

const mdtp = {
  onSaveAnnotation: updateAnnotationAsync,
  onSetEditingAnnotation: setEditingAnnotation,
  onDeleteAnnotation: deleteAnnotationAsync,
  setTagKeys: setTagKeysAction,
  onNotify: notify,
}

export default connect(mstp, mdtp)(AnnotationEditorContainer)
