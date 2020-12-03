import React, {FunctionComponent} from 'react'

import {RemoteDataState} from 'src/types'

interface Props {
  status: RemoteDataState
}

const Spinner: FunctionComponent<Props> = ({status}) => {
  if (status !== RemoteDataState.Loading) {
    return null
  }

  return <div className="simple-spinner" />
}

export default Spinner
