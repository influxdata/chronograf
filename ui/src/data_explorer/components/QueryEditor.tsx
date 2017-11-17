import * as React from 'react'

import Dropdown from 'shared/components/Dropdown'
import {QUERY_TEMPLATES} from 'data_explorer/constants'
import QueryStatus from 'shared/components/QueryStatus'

import {QueryConfig} from 'src/types'

export interface QueryEditorProps {
  query: string
  onUpdate: (value: string) => void
  config: QueryConfig
}

export interface QueryEditorState {
  value: string
}

class QueryEditor extends React.Component<QueryEditorProps, QueryEditorState> {
  private editor

  constructor(props: QueryEditorProps) {
    super(props)
    this.state = {
      value: this.props.query,
    }
  }

  private handleKeyDown = e => {
    const {value} = this.state

    if (e.key === 'Escape') {
      e.preventDefault()
      this.setState({value})
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      this.handleUpdate()
    }
  }

  private handleChange = () => {
    this.setState({value: this.editor.value})
  }

  private handleUpdate = () => {
    this.props.onUpdate(this.state.value)
  }

  private handleChooseMetaQuery = template => {
    this.setState({value: template.query})
  }

  public componentWillReceiveProps(nextProps: QueryEditorProps) {
    if (this.props.query !== nextProps.query) {
      this.setState({value: nextProps.query})
    }
  }

  public render() {
    const {config: {status}} = this.props
    const {value} = this.state

    return (
      <div className="query-editor">
        <textarea
          className="query-editor--field"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleUpdate}
          ref={editor => (this.editor = editor)}
          value={value}
          placeholder="Enter a query or select database, measurement, and field below and have us build one for you..."
          autoComplete="off"
          spellCheck={false}
          data-test="query-editor-field"
        />
        <div className="varmoji">
          <div className="varmoji-container">
            <div className="varmoji-front">
              <QueryStatus status={status}>
                <Dropdown
                  items={QUERY_TEMPLATES}
                  selected={'Query Templates'}
                  onChoose={this.handleChooseMetaQuery}
                  className="dropdown-140 query-editor--templates"
                  buttonSize="btn-xs"
                />
              </QueryStatus>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default QueryEditor
