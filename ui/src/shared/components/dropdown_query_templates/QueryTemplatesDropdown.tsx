import React, {Component} from 'react'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {ComponentSize} from 'src/reusable_ui/types'
import {
  QUERY_TEMPLATES,
  QueryTemplateTypes,
  QueryTemplate,
} from 'src/shared/components/dropdown_query_templates/queryTemplates'

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
          if (option.type === QueryTemplateTypes.Divider) {
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
