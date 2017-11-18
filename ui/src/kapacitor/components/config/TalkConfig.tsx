import * as React from 'react'

import RedactedInput from './RedactedInput'

export interface TalkOptions {
  url: string
  author_name: string
}

export interface TalkConfigProps {
  config: {
    options: TalkOptions
  }
  onSave: (properties: TalkOptions) => void
}

class TalkConfig extends React.Component<TalkConfigProps> {
  private url
  private author

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      url: this.url.value,
      author_name: this.author.value,
    }

    this.props.onSave(properties)
  }

  private handleUrlRef = r => (this.url = r)

  public render() {
    const {url, author_name: author} = this.props.config.options

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="url">URL</label>
          <RedactedInput
            defaultValue={url}
            id="url"
            refFunc={this.handleUrlRef}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="author">Author Name</label>
          <input
            className="form-control"
            id="author"
            type="text"
            ref={r => (this.author = r)}
            defaultValue={author || ''}
          />
        </div>

        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update Talk Config
          </button>
        </div>
      </form>
    )
  }
}

export default TalkConfig
