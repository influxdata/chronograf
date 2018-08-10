import {StepStatus} from 'src/reusable_ui/constants/wizard'
import {Source} from 'src/types'

export interface Step {
  title: string
  stepStatus: StepStatus
}

export type ToggleVisibility = (
  isVisible: boolean,
  source?: Source,
  jumpStep?: number
) => () => void
