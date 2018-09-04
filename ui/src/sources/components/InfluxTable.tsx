import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {DeleteKapacitor} from 'src/shared/actions/sources'

import InfluxTableHead from 'src/sources/components/InfluxTableHead'
import InfluxTableHeader from 'src/sources/components/InfluxTableHeader'
import InfluxTableRow from 'src/sources/components/InfluxTableRow'

import {Source, Me, Service, Kapacitor} from 'src/types'
import {ToggleWizard} from 'src/types/wizard'

interface Props {
  me: Me
  source: Source
  sources: Source[]
  services: Service[]
  isUsingAuth: boolean
  deleteKapacitor: DeleteKapacitor
  setActiveKapacitor: (kapacitor: Kapacitor) => void
  onDeleteSource: (source: Source) => void
  setActiveFlux: (source: Source, service: Service) => void
  deleteFlux: (fluxService: Service) => void
  toggleWizard: ToggleWizard
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
      isUsingAuth,
      me,
      toggleWizard,
    } = this.props

    return (
      <div className="panel">
        <InfluxTableHeader
          me={me}
          source={source}
          isUsingAuth={isUsingAuth}
          toggleWizard={toggleWizard}
        />
        <div className="panel-body">
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
                    toggleWizard={toggleWizard}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  private getServicesForSource(sourceID: string) {
    return this.props.services.filter(s => {
      return s.sourceID === sourceID
    })
  }
}

const mapStateToProps = ({auth: {isUsingAuth, me}}) => ({isUsingAuth, me})

export default connect(mapStateToProps)(InfluxTable)
