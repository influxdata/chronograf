import React, {PureComponent} from 'react'
import DatabaseDropdown from 'src/shared/components/DatabaseDropdown'
import {Radio} from 'src/reusable_ui'
import {Source, DropdownItem} from 'src/types'
import {WriteDataMode} from 'src/types'
import Dropdown from 'src/shared/components/Dropdown'

interface Props {
  handleSelectDatabase: (item: DropdownItem) => void
  selectedDatabase: string
  onToggleMode: (mode: WriteDataMode) => void
  precision: string
  handlePrecisionChange: (precision: string) => void
  errorThrown: () => void
  onClose: () => void
  mode: string
  source: Source
  useBuckets: boolean
}

class WriteDataHeader extends PureComponent<Props> {
  public render() {
    const {
      handleSelectDatabase,
      selectedDatabase,
      errorThrown,
      onClose,
      source,
      precision,
      useBuckets,
    } = this.props

    return (
      <div className="write-data-form--header">
        <div className="page-header--left" data-test="write-data-left-head">
          <h1 className="page-header--title">Write Data To</h1>
          <DatabaseDropdown
            source={source}
            onSelectDatabase={handleSelectDatabase}
            database={selectedDatabase}
            useBuckets={useBuckets}
            onErrorThrown={errorThrown}
          />
          {this.modeSelector}
        </div>
        <div className="page-header--right">
          <h1 className="page-header--title">With</h1>
          <Dropdown
            items={[{text: 's'}, {text: 'ms'}, {text: 'u'}, {text: 'ns'}]}
            selected={precision}
            useAutoComplete={false}
            toggleStyle={{width: 50}}
            onChoose={this.handlePrecisionChange}
          />
          <h1 className="page-header--title">Precision</h1>
          <span className="page-header__dismiss" onClick={onClose} />
        </div>
      </div>
    )
  }

  private handlePrecisionChange = (item: DropdownItem) =>
    this.props.handlePrecisionChange(item.text)

  private get modeSelector(): JSX.Element {
    const {mode, onToggleMode} = this.props

    return (
      <Radio>
        <Radio.Button
          id={`write-data-${WriteDataMode.File}`}
          value={WriteDataMode.File}
          titleText="Upload a file"
          onClick={onToggleMode}
          active={mode === WriteDataMode.File}
        >
          Upload File
        </Radio.Button>
        <Radio.Button
          id={`write-data-${WriteDataMode.Manual}`}
          value={WriteDataMode.Manual}
          titleText="Write data manually using Line Protocol"
          onClick={onToggleMode}
          active={mode === WriteDataMode.Manual}
        >
          Manual Entry
        </Radio.Button>
      </Radio>
    )
  }
}

export default WriteDataHeader
