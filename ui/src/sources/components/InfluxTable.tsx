// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router'

// Components
import InfluxTableHead from 'src/sources/components/InfluxTableHead'
import InfluxTableRow from 'src/sources/components/InfluxTableRow'
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'
import {Panel, IconFont} from 'src/reusable_ui'

// Actions
import {SetActiveKapacitor, DeleteKapacitor} from 'src/shared/actions/sources'

// Types
import {Source, Me, Service} from 'src/types'

interface Props {
  me: Me
  source: Source
  sources: Source[]
  services: Service[]
  isUsingAuth: boolean
  deleteKapacitor: DeleteKapacitor
  setActiveKapacitor: SetActiveKapacitor
  onDeleteSource: (source: Source) => void
  setActiveFlux: (source: Source, service: Service) => void
  deleteFlux: (fluxService: Service) => void
}

class InfluxTable extends PureComponent<Props> {
  public render() {
    const {
      source,
      sources,
      setActiveKapacitor,
      setActiveFlux,
      onDeleteSource,
      deleteKapacitor,
      deleteFlux,
    } = this.props

    return (
      <div className="row">
        <div className="col-md-12">
          <Panel>
            {this.panelHeader}
            <Panel.Body>
              <table className="table v-center margin-bottom-zero table-highlight">
                <InfluxTableHead />
                <tbody>
                  {sources.map(s => {
                    return (
                      <InfluxTableRow
                        key={s.id}
                        source={s}
                        services={this.getServicesForSource(s.id)}
                        currentSource={source}
                        onDeleteSource={onDeleteSource}
                        deleteKapacitor={deleteKapacitor}
                        setActiveKapacitor={setActiveKapacitor}
                        setActiveFlux={setActiveFlux}
                        deleteFlux={deleteFlux}
                      />
                    )
                  })}
                </tbody>
              </table>
            </Panel.Body>
          </Panel>
        </div>
      </div>
    )
  }

  private getServicesForSource(sourceID: string) {
    return this.props.services.filter(s => {
      return s.sourceID === sourceID
    })
  }

  private get panelHeader(): JSX.Element {
    const {source} = this.props

    return (
      <Panel.Header title={this.panelTitle}>
        <Authorized requiredRole={EDITOR_ROLE}>
          <Link
            to={`/sources/${source.id}/manage-sources/new`}
            className="btn btn-sm btn-primary"
          >
            <span className={`icon ${IconFont.Plus}`} /> Add Connection
          </Link>
        </Authorized>
      </Panel.Header>
    )
  }

  private get panelTitle(): string {
    const {isUsingAuth, me} = this.props
    if (isUsingAuth) {
      return `Connections for ${me.currentOrganization.name}`
    }

    return 'Connections'
  }
}

const mapStateToProps = ({auth: {isUsingAuth, me}}) => ({isUsingAuth, me})

export default connect(mapStateToProps)(InfluxTable)
