import {ActionType as CEOActionType} from 'src/dashboards/actions/cellEditorOverlay'
import {FieldOption} from 'src/types/dashboards'

export interface UpdateFieldOptionsAction {
  type: CEOActionType.UpdateFieldOptions
  payload: {
    fieldOptions: FieldOption[]
  }
}

export const updateFieldOptions = (
  fieldOptions: FieldOption[]
): UpdateFieldOptionsAction => {
  return {
    type: CEOActionType.UpdateFieldOptions,
    payload: {
      fieldOptions,
    },
  } as UpdateFieldOptionsAction
}
