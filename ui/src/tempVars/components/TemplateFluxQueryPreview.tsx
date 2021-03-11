import React, {PureComponent} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'
import TemplatePreviewList from 'src/tempVars/components/TemplatePreviewList'

import {RemoteDataState, TemplateValue} from 'src/types'

interface Props {
  items: TemplateValue[]
  loadingStatus: RemoteDataState
  onUpdateDefaultTemplateValue: (item: TemplateValue) => void
}

@ErrorHandling
class TemplateFluxQueryPreview extends PureComponent<Props> {
  public render() {
    const {items, loadingStatus, onUpdateDefaultTemplateValue} = this.props

    if (loadingStatus === RemoteDataState.NotStarted) {
      return null
    }

    if (loadingStatus === RemoteDataState.Loading) {
      return (
        <div className="form-group col-xs-12 temp-builder--results">
          <p className="temp-builder--validation loading">
            Loading Flux Query preview...
          </p>
        </div>
      )
    }

    if (loadingStatus === RemoteDataState.Error) {
      return (
        <div className="form-group col-xs-12 temp-builder--results">
          <p className="temp-builder--validation error">
            Flux Query failed to execute
          </p>
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="form-group col-xs-12 temp-builder--results">
          <p className="temp-builder--validation warning">
            Flux Query is syntactically correct but returned no results
          </p>
        </div>
      )
    }

    const pluralizer = items.length === 1 ? '' : 's'

    return (
      <div className="form-group col-xs-12 temp-builder--results">
        <p className="temp-builder--validation">
          Flux Query returned <strong>{items.length}</strong> value{pluralizer}
        </p>
        <TemplatePreviewList
          items={items}
          onUpdateDefaultTemplateValue={onUpdateDefaultTemplateValue}
        />
      </div>
    )
  }
}

export default TemplateFluxQueryPreview
