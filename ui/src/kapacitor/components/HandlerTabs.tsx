import React, {FunctionComponent, MouseEvent} from 'react'
import classnames from 'classnames'

import {Handler} from 'src/types/kapacitor'

interface HandlerWithText extends Handler {
  text: string
}

interface Props {
  handlersOnThisAlert: HandlerWithText[]
  selectedHandler: HandlerWithText
  handleChooseHandler: (
    ep: HandlerWithText
  ) => (event: MouseEvent<HTMLLIElement>) => void
  handleRemoveHandler: (
    ep: HandlerWithText
  ) => (event: MouseEvent<HTMLButtonElement>) => void
}

const HandlerTabs: FunctionComponent<Props> = ({
  handlersOnThisAlert,
  selectedHandler,
  handleChooseHandler,
  handleRemoveHandler,
}) =>
  handlersOnThisAlert.length ? (
    <ul className="endpoint-tabs">
      {handlersOnThisAlert.map((endpoint, i) => {
        return (
          <li
            key={i}
            className={classnames('endpoint-tab', {
              active:
                endpoint.alias === (selectedHandler && selectedHandler.alias),
            })}
            onClick={handleChooseHandler(endpoint)}
          >
            {endpoint.text}
            <button
              className="endpoint-tab--delete"
              onClick={handleRemoveHandler(endpoint)}
            />
          </li>
        )
      })}
    </ul>
  ) : null

export default HandlerTabs
