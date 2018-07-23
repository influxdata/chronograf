import {ReactNode} from 'react'

export interface WizardStepProps {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious: () => void
  onNext: () => void
  increment?: () => void
  decrement?: () => void
  tipText?: string
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
}

export enum ConnectorState {
  None = 'none',
  Some = 'some',
  Full = 'full',
}

export enum StepStatus {
  Incomplete = 'circle-thick',
  Complete = 'checkmark',
  Error = 'remove',
}

export interface Step {
  title: string
  stepStatus: StepStatus
}
