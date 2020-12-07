import React, {PureComponent} from 'react'

import DatabaseList from 'src/flux/components/DatabaseList'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {Source, NotificationAction} from 'src/types'

interface Props {
  source: Source
  notify: NotificationAction
  v2?: boolean
}

class SchemaExplorer extends PureComponent<Props> {
  public render() {
    const {source, notify, v2} = this.props
    return (
      <div className="flux-schema-explorer">
        <FancyScrollbar>
          <DatabaseList source={source} notify={notify} v2={v2} />
        </FancyScrollbar>
      </div>
    )
  }
}

export default SchemaExplorer
