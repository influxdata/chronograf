import * as React from 'react'
import * as PropTypes from 'prop-types'
import {Link, withRouter} from 'react-router-dom'

import Dropdown from 'shared/components/Dropdown'
import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'

const kapacitorDropdown = (
  kapacitors,
  source,
  router,
  setActiveKapacitor,
  handleDeleteKapacitor
) => {
  if (!kapacitors || kapacitors.length === 0) {
    return (
      <Link
        to={`/sources/${source.id}/kapacitors/new`}
        className="btn btn-xs btn-default"
      >
        <span className="icon plus" /> Add Config
      </Link>
    )
  }
  const kapacitorItems = kapacitors.map(k => {
    return {
      text: k.name,
      resource: `/sources/${source.id}/kapacitors/${k.id}`,
      kapacitor: k,
    }
  })

  const activeKapacitor = kapacitors.find(k => k.active)

  let selected = ''
  if (activeKapacitor) {
    selected = activeKapacitor.name
  } else {
    selected = kapacitorItems[0].text
  }

  return (
    <Dropdown
      className="dropdown-260"
      buttonColor="btn-primary"
      buttonSize="btn-xs"
      items={kapacitorItems}
      onChoose={setActiveKapacitor}
      addNew={{
        url: `/sources/${source.id}/kapacitors/new`,
        text: 'Add Kapacitor',
      }}
      actions={[
        {
          icon: 'pencil',
          text: 'edit',
          handler: item => {
            router.push(`${item.resource}/edit`)
          },
        },
        {
          icon: 'trash',
          text: 'delete',
          handler: item => {
            handleDeleteKapacitor(item.kapacitor)
          },
          confirmable: true,
        },
      ]}
      selected={selected}
    />
  )
}

const InfluxTable = ({
  source,
  router,
  sources,
  location,
  setActiveKapacitor,
  handleDeleteSource,
  handleDeleteKapacitor,
}) =>
  <div className="row">
    <div className="col-md-12">
      <div className="panel panel-minimal">
        <div className="panel-heading u-flex u-ai-center u-jc-space-between">
          <h2 className="panel-title">InfluxDB Sources</h2>
          <Link
            to={`/sources/${source.id}/manage-sources/new`}
            className="btn btn-sm btn-primary"
          >
            <span className="icon plus" /> Add Source
          </Link>
        </div>
        <div className="panel-body">
          <table className="table v-center margin-bottom-zero table-highlight">
            <thead>
              <tr>
                <th className="source-table--connect-col" />
                <th>Source Name & Host</th>
                <th className="text-right" />
                <th>
                  Active Kapacitor{' '}
                  <QuestionMarkTooltip
                    tipID="kapacitor-node-helper"
                    tipContent={
                      '<p>Kapacitor Configurations are<br/>scoped per InfluxDB Source.<br/>Only one can be active at a time.</p>'
                    }
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => {
                return (
                  <tr
                    key={s.id}
                    className={s.id === source.id ? 'highlight' : null}
                  >
                    <td>
                      {s.id === source.id
                        ? <div className="btn btn-success btn-xs source-table--connect">
                            Connected
                          </div>
                        : <Link
                            className="btn btn-default btn-xs source-table--connect"
                            to={`/sources/${s.id}/hosts`}
                          >
                            Connect
                          </Link>}
                    </td>
                    <td>
                      <h5 className="margin-zero">
                        <Link
                          to={`${location.pathname}/${s.id}/edit`}
                          className={s.id === source.id ? 'link-success' : null}
                        >
                          <strong>
                            {s.name}
                          </strong>
                          {s.default ? ' (Default)' : null}
                        </Link>
                      </h5>
                      <span>
                        {s.url}
                      </span>
                    </td>
                    <td className="text-right">
                      <a
                        className="btn btn-xs btn-danger table--show-on-row-hover"
                        href="#"
                        onClick={handleDeleteSource(s)}
                      >
                        Delete Source
                      </a>
                    </td>
                    <td className="source-table--kapacitor">
                      {kapacitorDropdown(
                        s.kapacitors,
                        s,
                        router,
                        setActiveKapacitor,
                        handleDeleteKapacitor
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

const {array, func, shape, string} = PropTypes

InfluxTable.propTypes = {
  handleDeleteSource: func.isRequired,
  location: shape({
    pathname: string.isRequired,
  }).isRequired,
  router: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  source: shape({
    id: string.isRequired,
    links: shape({
      proxy: string.isRequired,
      self: string.isRequired,
    }),
  }),
  sources: array.isRequired,
  setActiveKapacitor: func.isRequired,
  handleDeleteKapacitor: func.isRequired,
}

export default withRouter(InfluxTable)
