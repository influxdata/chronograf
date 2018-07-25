import React, {Component} from 'react'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {ComponentSize} from 'src/reusable_ui/types'
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
            return <Dropdown.Divider key={`group-by-time-${option.key}`} />
          }

          return (
            <Dropdown.Item
              key={`group-by-time-${option.key}`}
              text={option.text}
              value={option}
            />
          )
        })}
      </Dropdown>
    )
  }
}

export default QueryTemplatesDropdown
