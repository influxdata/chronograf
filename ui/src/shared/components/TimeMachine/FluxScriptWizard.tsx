// Libraries
import React, {PureComponent} from 'react'
import {flatten} from 'lodash'

// Components
import {
  Form,
  Button,
  ComponentColor,
  ComponentStatus,
  Dropdown,
  MultiSelectDropdown,
} from 'src/reusable_ui'

// Utils
import {restartable} from 'src/shared/utils/restartable'
import {
  fetchDBsToRPs,
  fetchMeasurements,
  fetchFields,
  formatDBwithRP,
  toComponentStatus,
  renderScript,
  getDefaultDBandRP,
  DBsToRPs,
} from 'src/shared/utils/fluxScriptWizard'

// Types
import {RemoteDataState, Source} from 'src/types'

// This constant is selected so that dropdown menus will not overflow out of
// the `.flux-script-wizard--wizard` window
const DROPDOWN_MENU_HEIGHT = 110

interface Props {
  source: Source
  children: JSX.Element
  isWizardActive: boolean
  onSetIsWizardActive: (isWizardActive: boolean) => void
  onAddToScript: (script: string) => void
}

interface State {
  dbsToRPs: DBsToRPs
  dbsToRPsStatus: RemoteDataState
  selectedDB: string | null
  selectedRP: string | null
  measurements: string[]
  measurementsStatus: RemoteDataState
  selectedMeasurement: string | null
  fields: string[]
  fieldsStatus: RemoteDataState
  selectedFields: string[] | null
}

class FluxScriptWizard extends PureComponent<Props, State> {
  public state: State = {
    dbsToRPs: {},
    dbsToRPsStatus: RemoteDataState.NotStarted,
    selectedDB: null,
    selectedRP: null,
    measurements: [],
    measurementsStatus: RemoteDataState.NotStarted,
    selectedMeasurement: null,
    fields: [],
    fieldsStatus: RemoteDataState.NotStarted,
    selectedFields: null,
  }

  private fetchDBsToRPs = restartable(fetchDBsToRPs)
  private fetchMeasurements = restartable(fetchMeasurements)
  private fetchFields = restartable(fetchFields)

  public componentDidMount() {
    this.fetchAndSetDBsToRPs()
  }

  public render() {
    const {children, isWizardActive} = this.props
    const {
      measurements,
      fields,
      selectedMeasurement,
      selectedFields,
    } = this.state

    if (!isWizardActive) {
      return (
        <div className="flux-script-wizard">
          <div className="flux-script-wizard--children">{children}</div>
        </div>
      )
    }

    return (
      <div className="flux-script-wizard">
        <div className="flux-script-wizard--children">{children}</div>
        <div
          className="flux-script-wizard--backdrop"
          onClick={this.handleClose}
        />
        <div className="flux-script-wizard--wizard">
          <div className="flux-script-wizard--wizard-header">
            <h3>Flux Script Wizard</h3>
            <div
              className="flux-script-wizard--close"
              onClick={this.handleClose}
            >
              &times;
            </div>
          </div>
          <div className="flux-script-wizard--wizard-body">
            <Form>
              <Form.Element label="Choose a Bucket">
                <Dropdown
                  status={this.bucketDropdownStatus}
                  selectedID={this.bucketDropdownSelectedID}
                  maxMenuHeight={DROPDOWN_MENU_HEIGHT}
                  onChange={this.handleSelectBucket}
                >
                  {this.bucketDropdownItems}
                </Dropdown>
              </Form.Element>
              <Form.Element label="Choose a Measurement">
                <Dropdown
                  status={this.measurementDropdownStatus}
                  selectedID={selectedMeasurement}
                  maxMenuHeight={DROPDOWN_MENU_HEIGHT}
                  onChange={this.handleSelectMeasurement}
                >
                  {measurements.map(measurement => (
                    <Dropdown.Item
                      key={measurement}
                      id={measurement}
                      value={measurement}
                    >
                      {measurement}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
              </Form.Element>
              <Form.Element label="Choose Measurement Fields">
                <MultiSelectDropdown
                  status={this.fieldsDropdownStatus}
                  selectedIDs={selectedFields}
                  emptyText={'All Fields'}
                  maxMenuHeight={DROPDOWN_MENU_HEIGHT}
                  onChange={this.handleSelectFields}
                >
                  {fields.map(field => (
                    <Dropdown.Item key={field} id={field} value={{id: field}}>
                      {field}
                    </Dropdown.Item>
                  ))}
                </MultiSelectDropdown>
              </Form.Element>
              <Form.Footer>
                <Button
                  text="Insert Script"
                  color={ComponentColor.Primary}
                  status={this.buttonStatus}
                  onClick={this.handleAddToScript}
                />
              </Form.Footer>
            </Form>
          </div>
        </div>
      </div>
    )
  }

  private get bucketDropdownItems(): JSX.Element[] {
    const {dbsToRPs} = this.state

    const itemData = flatten(
      Object.entries(dbsToRPs).map(([db, rps]) => rps.map(rp => [db, rp]))
    )

    const bucketDropdownItems = itemData.map(([db, rp]) => {
      const name = formatDBwithRP(db, rp)

      return (
        <Dropdown.Item key={name} id={name} value={[db, rp]}>
          {name}
        </Dropdown.Item>
      )
    })

    return bucketDropdownItems
  }

  private get bucketDropdownSelectedID(): string {
    const {selectedDB, selectedRP} = this.state
    return formatDBwithRP(selectedDB, selectedRP)
  }

  private get bucketDropdownStatus(): ComponentStatus {
    const {dbsToRPsStatus} = this.state
    const bucketDropdownStatus = toComponentStatus(dbsToRPsStatus)

    return bucketDropdownStatus
  }

  private get measurementDropdownStatus(): ComponentStatus {
    const {measurementsStatus} = this.state
    const measurementDropdownStatus = toComponentStatus(measurementsStatus)

    return measurementDropdownStatus
  }

  private get fieldsDropdownStatus(): ComponentStatus {
    const {fieldsStatus} = this.state
    const fieldsDropdownStatus = toComponentStatus(fieldsStatus)

    return fieldsDropdownStatus
  }

  private get buttonStatus(): ComponentStatus {
    const {dbsToRPsStatus, measurementsStatus, fieldsStatus} = this.state
    const allDone = [dbsToRPsStatus, measurementsStatus, fieldsStatus].every(
      s => s === RemoteDataState.Done
    )

    if (allDone) {
      return ComponentStatus.Default
    }

    return ComponentStatus.Disabled
  }

  private handleClose = () => {
    this.props.onSetIsWizardActive(false)
  }

  private handleSelectBucket = ([selectedDB, selectedRP]: [string, string]) => {
    this.setState({selectedDB, selectedRP}, this.fetchAndSetMeasurements)
  }

  private handleSelectMeasurement = (selectedMeasurement: string) => {
    this.setState({selectedMeasurement}, this.fetchAndSetFields)
  }

  private handleSelectFields = (selectedFields: string[]) => {
    this.setState({selectedFields})
  }

  private handleAddToScript = () => {
    const {onSetIsWizardActive, onAddToScript} = this.props
    const {
      selectedDB,
      selectedRP,
      selectedMeasurement,
      selectedFields,
    } = this.state
    const selectedBucket = formatDBwithRP(selectedDB, selectedRP)
    const script = renderScript(
      selectedBucket,
      selectedMeasurement,
      selectedFields
    )

    onAddToScript(script)
    onSetIsWizardActive(false)
  }

  private fetchAndSetDBsToRPs = async () => {
    const {source} = this.props

    this.setState({
      dbsToRPs: {},
      dbsToRPsStatus: RemoteDataState.Loading,
      selectedDB: null,
      selectedRP: null,
      measurements: [],
      measurementsStatus: RemoteDataState.NotStarted,
      selectedMeasurement: null,
      fields: [],
      fieldsStatus: RemoteDataState.NotStarted,
      selectedFields: [],
    })

    let dbsToRPs

    try {
      dbsToRPs = await this.fetchDBsToRPs(source.links.proxy)
    } catch {
      this.setState({dbsToRPsStatus: RemoteDataState.Error})

      return
    }

    const [selectedDB, selectedRP] = getDefaultDBandRP(dbsToRPs)

    this.setState(
      {
        dbsToRPs,
        dbsToRPsStatus: RemoteDataState.Done,
        selectedDB,
        selectedRP,
      },
      this.fetchAndSetMeasurements
    )
  }

  private fetchAndSetMeasurements = async () => {
    const {source} = this.props
    const {selectedDB} = this.state

    this.setState({
      measurements: [],
      measurementsStatus: RemoteDataState.Loading,
      selectedMeasurement: null,
      fields: [],
      fieldsStatus: RemoteDataState.NotStarted,
      selectedFields: [],
    })

    let measurements

    try {
      measurements = await this.fetchMeasurements(
        source.links.proxy,
        selectedDB
      )
    } catch {
      this.setState({
        measurements: [],
        measurementsStatus: RemoteDataState.Error,
        selectedMeasurement: null,
      })

      return
    }

    this.setState(
      {
        measurements,
        measurementsStatus: RemoteDataState.Done,
        selectedMeasurement: measurements[0],
      },
      this.fetchAndSetFields
    )
  }

  private fetchAndSetFields = async () => {
    const {source} = this.props
    const {selectedDB, selectedMeasurement} = this.state

    this.setState({
      fields: [],
      fieldsStatus: RemoteDataState.Loading,
      selectedFields: [],
    })

    let fields

    try {
      fields = await this.fetchFields(
        source.links.proxy,
        selectedDB,
        selectedMeasurement
      )
    } catch {
      this.setState({
        fields: [],
        fieldsStatus: RemoteDataState.Error,
        selectedFields: [],
      })

      return
    }

    this.setState({
      fields,
      fieldsStatus: RemoteDataState.Done,
      selectedFields: [],
    })
  }
}

export default FluxScriptWizard
