import {ReactNode} from 'react'
import {DygraphValue, DygraphOptions} from 'src/types'

export interface DropdownItem {
  text: string
}

export interface DropdownAction {
  icon: string
  text: string
  handler: () => void
}

export interface PageSection {
  url: string
  name: string
  component: ReactNode
  enabled: boolean
}

export interface Constructable<T> {
  new (
    container: HTMLElement | string,
    data: DygraphValue[][] | (() => DygraphValue[][]),
    options?: DygraphOptions
  ): T
}
