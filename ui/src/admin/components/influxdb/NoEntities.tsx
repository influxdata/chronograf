import React, {FunctionComponent} from 'react'

interface Props {
  entities: string
  filtered?: boolean
}
const NoEntities: FunctionComponent<Props> = ({entities, filtered}) =>
  filtered ? (
    <p className="empty">No Matching {entities} Found</p>
  ) : (
    <p className="empty">
      You don't have any {entities},<br />
      why not create one?
    </p>
  )

export default NoEntities
