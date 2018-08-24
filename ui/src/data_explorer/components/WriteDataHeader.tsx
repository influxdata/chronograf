import React, {PureComponent} from 'react'
import DatabaseDropdown from 'src/shared/components/DatabaseDropdown'
import {Radio} from 'src/reusable_ui'
import {Source, DropdownItem} from 'src/types'
import {WriteDataMode} from 'src/types'

interface Props {
  handleSelectDatabase: (item: DropdownItem) => void
  selectedDatabase: string
  onToggleMode: (mode: WriteDataMode) => void
  errorThrown: () => void
  onClose: () => void
  mode: string
  source: Source
}

class WriteDataHeader extends PureComponent<Props> {
  public render() {
    const {
      handleSelectDatabase,
      selectedDatabase,
      errorThrown,
      onClose,
      source,
    } = this.props

    return (
      <div className="write-data-form--header">
        <div className="page-header--left">
          <h1 className="page-header--title">Write Data To</h1>
          <DatabaseDropdown
            source={source}
            onSelectDatabase={handleSelectDatabase}
            database={selectedDatabase}
            onErrorThrown={errorThrown}
          />
          {this.modeSelector}
        </div>
        <div className="page-header--right">
          <span className="page-header__dismiss" onClick={onClose} />
        </div>
      </div>
    )
  }

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
