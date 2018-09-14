import {ReactNode} from 'react'

export interface DropdownItem {
  text: string
}

export interface DropdownAction {
  icon: string
  text: string
  handler: (item: DropdownItem) => void
}

export interface PageSection {
  url: string
  name: string
  component: ReactNode
  enabled: boolean
}
