import React, {PureComponent} from 'react'

import DatabaseList from 'src/flux/components/DatabaseList'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {Service, NotificationAction} from 'src/types'

interface Props {
  service: Service
  notify: NotificationAction
}

class SchemaExplorer extends PureComponent<Props> {
  public render() {
    const {service, notify} = this.props
    return (
      <div className="flux-schema-explorer">
        <FancyScrollbar>
          <DatabaseList service={service} notify={notify} />
        </FancyScrollbar>
      </div>
    )
  }
}

export default SchemaExplorer
