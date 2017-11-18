import * as React from 'react'
import * as classnames from 'classnames'

import onClickOutside from 'shared/components/onClickOutside'
import WriteDataBody from 'data_explorer/components/WriteDataBody'
import WriteDataHeader from 'data_explorer/components/WriteDataHeader'

import {OVERLAY_TECHNOLOGY} from 'shared/constants/classNames'
let dragCounter = 0

import {Source} from 'src/types'
import {eFunc, func} from 'src/types/funcs'

export interface WriteDataFormProps {
  source: Source
  onClose: func
  writeLineProtocol: (
    source: Source,
    selectedDatabase: string,
    content: string
  ) => void
  errorThrown: eFunc
  selectedDatabase: string
}

export interface WriteDataFormState {
  selectedDatabase: string
  inputContent: string | null
  uploadContent: string
  fileName: string
  progress: string
  isManual: boolean
  dragClass: string
  isUploading: boolean
}

class WriteDataForm extends React.Component<
  WriteDataFormProps,
  WriteDataFormState
> {
  private fileInput

  constructor(props: WriteDataFormProps) {
    super(props)
    this.state = {
      selectedDatabase: props.selectedDatabase,
      inputContent: null,
      uploadContent: '',
      fileName: '',
      progress: '',
      isManual: false,
      dragClass: 'drag-none',
      isUploading: false,
    }
  }

  private toggleWriteView = isManual => () => {
    this.setState({isManual})
  }

  private handleSelectDatabase = item => {
    this.setState({selectedDatabase: item.text})
  }

  private handleKeyUp = e => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      const {onClose} = this.props
      onClose()
    }
  }

  private handleSubmit = async () => {
    const {onClose, source, writeLineProtocol} = this.props
    const {inputContent, uploadContent, selectedDatabase, isManual} = this.state
    const content = isManual ? inputContent : uploadContent
    this.setState({isUploading: true})

    try {
      await writeLineProtocol(source, selectedDatabase, content)
      this.setState({isUploading: false})
      onClose()
      window.location.reload()
    } catch (error) {
      this.setState({isUploading: false})
      console.error(error.data.error)
    }
  }

  private handleEdit = e => {
    this.setState({inputContent: e.target.value.trim()})
  }

  private handleFile = drop => e => {
    let file
    if (drop) {
      file = e.dataTransfer.files[0]
      this.setState({
        dragClass: 'drag-none',
      })
    } else {
      file = e.target.files[0]
    }

    if (!file) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      this.setState({
        uploadContent: reader.result,
        fileName: file.name,
      })
    }
  }

  private handleCancelFile = () => {
    this.setState({uploadContent: ''})
    this.fileInput.value = ''
  }

  private handleDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
  }

  private handleDragEnter = e => {
    dragCounter += 1
    e.preventDefault()
    this.setState({dragClass: 'drag-over'})
  }

  private handleDragLeave = e => {
    dragCounter -= 1
    e.preventDefault()
    if (dragCounter === 0) {
      this.setState({dragClass: 'drag-none'})
    }
  }

  private handleFileOpen = () => {
    const {uploadContent} = this.state
    if (uploadContent === '') {
      this.fileInput.click()
    }
  }

  private handleFileInputRef = el => (this.fileInput = el)

  public handleClickOutside = e => {
    // guard against clicking to close error notification
    if (e.target.className === OVERLAY_TECHNOLOGY) {
      const {onClose} = this.props
      onClose()
    }
  }

  public render() {
    const {onClose, errorThrown, source} = this.props
    const {dragClass} = this.state

    return (
      <div
        onDrop={this.handleFile(true)}
        onDragOver={this.handleDragOver}
        onDragEnter={this.handleDragEnter}
        onDragExit={this.handleDragLeave}
        onDragLeave={this.handleDragLeave}
        className={classnames(OVERLAY_TECHNOLOGY, dragClass)}
      >
        <div className="write-data-form">
          <WriteDataHeader
            {...this.state}
            handleSelectDatabase={this.handleSelectDatabase}
            errorThrown={errorThrown}
            toggleWriteView={this.toggleWriteView}
            onClose={onClose}
            source={source}
          />
          <WriteDataBody
            {...this.state}
            fileInput={this.handleFileInputRef}
            handleEdit={this.handleEdit}
            handleFile={this.handleFile}
            handleKeyUp={this.handleKeyUp}
            handleSubmit={this.handleSubmit}
            handleFileOpen={this.handleFileOpen}
            handleCancelFile={this.handleCancelFile}
          />
        </div>
      </div>
    )
  }
}

export default onClickOutside<WriteDataFormProps>(WriteDataForm)
