// Libraries
import React, {Component} from 'react'
import Markdown from 'react-markdown'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  text: string
}

@ErrorHandling
class MarkdownCell extends Component<Props> {
  public render() {
    const {text} = this.props

    return (
      <FancyScrollbar className="markdown-cell" autoHide={true}>
        <div className="markdown-cell--contents">
          <Markdown source={text} className="markdown-format" />
        </div>
      </FancyScrollbar>
    )
  }
}

export default MarkdownCell
