import React, {SFC} from 'react'

import {Page} from 'src/reusable_ui'

interface Props {
  onGoToNewService: () => void
}

const EmptyFluxPage: SFC<Props> = ({onGoToNewService}) => (
  <Page>
    <Page.Header>
      <Page.Header.Left>
        <Page.Title title="Flux Editor" />
      </Page.Header.Left>
      <Page.Header.Right />
    </Page.Header>
    <Page.Contents scrollable={false} fullWidth={true}>
      <div className="flux-empty">
        <p>You do not have a configured Flux source</p>
        <button className="btn btn-primary btn-md" onClick={onGoToNewService}>
          Connect to Flux
        </button>
      </div>
    </Page.Contents>
  </Page>
)

export default EmptyFluxPage
