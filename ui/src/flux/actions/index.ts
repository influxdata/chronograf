export type Action = ActionUpdateScript

export enum ActionTypes {
  UpdateScript = 'UPDATE_SCRIPT',
}

export interface ActionUpdateScript {
  type: ActionTypes.UpdateScript
  payload: {
    script: string
  }
}

export type UpdateScript = (script: string) => ActionUpdateScript
