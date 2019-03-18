import _ from 'lodash'
import Papa from 'papaparse'

import {TEMPLATE_VARIABLE_TYPES} from 'src/tempVars/constants'
import {
  Template,
  TemplateValue,
  TemplateType,
  TemplateValueType,
} from 'src/types'

export const trimAndRemoveQuotes = elt => {
  const trimmed = elt.trim()
  const dequoted = trimmed.replace(/(^")|("$)/g, '')

  return dequoted
}

export const formatTempVar = name =>
  `:${name.replace(/:/g, '').replace(/\s/g, '')}:`

export const resolveValues = (
  template: Template,
  newValues?: string[],
  hopefullySelectedValue?: string
): TemplateValue[] => {
  switch (template.type) {
    case TemplateType.Text:
      return newTemplateValueText(template, hopefullySelectedValue)
    case TemplateType.CSV:
    case TemplateType.Map:
      return newTemplateValueConstant(template, hopefullySelectedValue)
    case TemplateType.MetaQuery:
    case TemplateType.FieldKeys:
    case TemplateType.Measurements:
    case TemplateType.TagKeys:
    case TemplateType.TagValues:
    case TemplateType.Databases:
      return newTemplateValueQuery(template, newValues, hopefullySelectedValue)
    default:
      throw new Error(
        `TemplateValue resolution for TemplateType ${
          template.type
        } not implemented`
      )
  }
}

const newTemplateValueQuery = (
  template: Template,
  newValues: string[],
  hopefullySelectedValue?: string
) => {
  if (!newValues.length) {
    return []
  }

  const type = TEMPLATE_VARIABLE_TYPES[template.type]

  let selectedValue = getSelectedValue(template)

  if (!selectedValue || !newValues.includes(selectedValue)) {
    // The persisted selected value may no longer exist as a result for the
    // templates metaquery. In this case we select the first actual result
    selectedValue = newValues[0]
  }

  let localSelectedValue = hopefullySelectedValue

  if (!localSelectedValue) {
    localSelectedValue = getLocalSelectedValue(template)
  }

  if (!localSelectedValue || !newValues.includes(localSelectedValue)) {
    localSelectedValue = selectedValue
  }

  return newValues.map(value => {
    return {
      type,
      value,
      selected: value === selectedValue,
      localSelected: value === localSelectedValue,
    }
  })
}

const newTemplateValueConstant = (
  template: Template,
  hopefullySelectedValue?: string
) => {
  if (!template.values.length) {
    return []
  }

  let selectedValue = template.values.find(v => v.selected)

  if (!selectedValue) {
    selectedValue = template.values[0]
  }

  let localSelectedValue = template.values.find(v => {
    return template.type === TemplateType.Map
      ? v.key === hopefullySelectedValue
      : v.value === hopefullySelectedValue
  })

  if (!localSelectedValue) {
    localSelectedValue = template.values.find(v => v.localSelected)
  }

  if (!localSelectedValue) {
    localSelectedValue = selectedValue
  }

  return template.values.map(v => ({
    ...v,
    selected: v.value === selectedValue.value,
    localSelected: v.value === localSelectedValue.value,
  }))
}

const newTemplateValueText = (
  template: Template,
  hopefullySelectedValue?: string
) => {
  if (!!hopefullySelectedValue) {
    return [
      {
        value: hopefullySelectedValue,
        type: TemplateValueType.Constant,
        localSelected: true,
        selected: false,
      },
    ]
  } else if (template.values.length) {
    return [{...template.values[0], localSelected: true}]
  } else {
    return [
      {
        value: '',
        type: TemplateValueType.Constant,
        localSelected: true,
        selected: false,
      },
    ]
  }
}

export const getSelectedValue = (template: Template): string | null => {
  const selected = template.values.find(v => v.selected)

  if (selected) {
    return selected.value
  }

  return null
}

export const getLocalSelectedValue = (template: Template): string | null => {
  const selected = template.values.find(v => v.localSelected)

  if (selected) {
    return selected.value
  }

  return null
}

interface MapResult {
  values: TemplateValue[]
  errors: string[]
}

export const csvToMap = (csv: string): MapResult => {
  let errors = []
  const trimmed = _.trimEnd(csv, '\n')
  const parsedTVS = Papa.parse(trimmed)
  const templateValuesData: string[][] = _.get(parsedTVS, 'data', [[]])

  if (templateValuesData.length === 0) {
    return
  }

  let arrayOfKeys = []
  let values = []
  for (const arr of templateValuesData) {
    if (arr.length === 2 || (arr.length === 3 && arr[2] === '')) {
      const key = trimAndRemoveQuotes(arr[0])
      const value = trimAndRemoveQuotes(arr[1])

      if (!arrayOfKeys.includes(key) && key !== '') {
        values = [
          ...values,
          {
            type: TemplateValueType.Map,
            value,
            key,
            selected: false,
            localSelected: false,
          },
        ]
        arrayOfKeys = [...arrayOfKeys, key]
      }
    } else {
      errors = [...errors, arr[0]]
    }
  }

  return {values, errors}
}

export const mapToCSV = (values: TemplateValue[]): string =>
  values.map(v => `${v.key},"${v.value}"`).join('\n')
