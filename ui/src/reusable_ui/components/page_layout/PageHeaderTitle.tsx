import React, {FunctionComponent} from 'react'

interface Props {
  title: string
}

const PageTitle: FunctionComponent<Props> = ({title}) => (
  <h1 className="page-header--title">{title}</h1>
)

export default PageTitle
