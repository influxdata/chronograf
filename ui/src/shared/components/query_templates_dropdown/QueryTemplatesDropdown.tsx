import React, {Component} from 'react'
import uuid from 'uuid'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {ComponentSize} from 'src/reusable_ui/types'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import DropdownDivider from 'src/reusable_ui/components/dropdowns/DropdownDivider'
import {
  QUERY_TEMPLATES,
  DIVIDER,
  QueryTemplate,
} from 'src/shared/components/query_templates_dropdown/queryTemplates'

interface Props {
  onChoose: (template: QueryTemplate) => void
}

class QueryTemplatesDropdown extends Component<Props> {
  public render() {
    const {onChoose} = this.props

    return (
      <Dropdown
        size={ComponentSize.ExtraSmall}
        selectedItem="Query Templates"
        onChange={onChoose}
        customClass="query-editor--templates"
        width={142}
      >
        {QUERY_TEMPLATES.map(option => {
          if (option.text === DIVIDER) {
            return <DropdownDivider key={uuid.v4()} />
          }

          return (
            <DropdownItem key={uuid.v4()} text={option.text} value={option} />
          )
        })}
      </Dropdown>
    )
  }
}

export default QueryTemplatesDropdown
