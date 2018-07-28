import {ReactNode} from 'react'
import {StepStatus} from 'src/reusable_ui/constants/wizard'

export interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious?: () => void
  onNext?: () => void
  increment?: () => void
  decrement?: () => void
  tipText?: string
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
}

export interface Step {
  title: string
  stepStatus: StepStatus
}
