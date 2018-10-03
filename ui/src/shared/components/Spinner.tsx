import React, {SFC} from 'react'

import {RemoteDataState} from 'src/types'

interface Props {
  status: RemoteDataState
}

const Spinner: SFC<Props> = ({status}) => {
  if (status !== RemoteDataState.Loading) {
    return null
  }

  return <div className="simple-spinner" />
}

export default Spinner
