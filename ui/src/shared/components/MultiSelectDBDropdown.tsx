import * as React from 'react'

import {showDatabases, showRetentionPolicies} from 'shared/apis/metaQuery'
import showDatabasesParser from 'shared/parsing/showDatabases'
import showRetentionPoliciesParser from 'shared/parsing/showRetentionPolicies'
import MultiSelectDropdown from 'shared/components/MultiSelectDropdown'

import {Rule, Source, Task} from 'src/types'
import {eFunc} from 'src/types/funcs'

export interface MultiSelectDBDropdownProps {
  onErrorThrown?: eFunc
  onApply: eFunc
  selectedItems: Rule | Task
  source: Source
}

class MultiSelectDBDropdown extends React.Component<
  MultiSelectDBDropdownProps
> {
  public state = {
    dbrps: [],
  }

  public componentDidMount() {
    this._getDbRps()
  }

  public render() {
    const {dbrps} = this.state
    const {onApply, selectedItems} = this.props
    const label = 'Select databases'

    return (
      <MultiSelectDropdown
        label={label}
        items={dbrps}
        onApply={onApply}
        isApplyShown={false}
        selectedItems={selectedItems}
      />
    )
  }

  public _getDbRps = async () => {
    const {onErrorThrown, source: {links: {proxy}}} = this.props

    try {
      const {data} = await showDatabases(proxy)
      const {databases, errors} = showDatabasesParser(data)
      if (errors.length > 0) {
        throw errors[0] // only one error can come back from this, but it's returned as an array
      }

      const response = await showRetentionPolicies(proxy, databases)
      const dbrps = response.data.results.reduce((acc, result, i) => {
        const {retentionPolicies} = showRetentionPoliciesParser(result)
        const db = databases[i]

        const rps = retentionPolicies.map(({name: rp}) => ({
          db,
          rp,
          name: `${db}.${rp}`,
        }))

        return [...acc, ...rps]
      }, [])

      this.setState({dbrps})
    } catch (error) {
      console.error(error)
      onErrorThrown(error)
    }
  }
}

export default MultiSelectDBDropdown
