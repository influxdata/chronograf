import React, {PureComponent} from 'react'

import DatabaseList from 'src/flux/components/DatabaseList'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {Source, NotificationAction} from 'src/types'

interface Props {
  source: Source
  notify: NotificationAction
  onAppendScript: (appendage: string) => void
}

class SchemaExplorer extends PureComponent<Props> {
  public render() {
    const {source, notify, onAppendScript} = this.props
    return (
      <div className="flux-schema-explorer">
        <FancyScrollbar>
          <DatabaseList
            source={source}
            notify={notify}
            onAppendScript={onAppendScript}
          />
        </FancyScrollbar>
      </div>
    )
  }
}

export default SchemaExplorer
