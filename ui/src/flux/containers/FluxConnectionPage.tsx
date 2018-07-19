import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import FluxNew from 'src/flux/components/FluxNew'
import FluxEdit from 'src/flux/components/FluxEdit'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {getService} from 'src/shared/apis'
import {FluxFormMode} from 'src/flux/constants/connection'

import {
  updateServiceAsync,
  UpdateServiceAsync,
  createServiceAsync,
  CreateServiceAsync,
} from 'src/shared/actions/services'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {Service, Source, Notification} from 'src/types'

interface Props {
  services: Service[]
  source: Source
  params: {id: string; sourceID: string}
  router: {push: (url: string) => void}
  notify: (message: Notification) => void
  createService: CreateServiceAsync
  updateService: UpdateServiceAsync
}

interface State {
  service: Service
  formMode: FluxFormMode
}

@ErrorHandling
class FluxConnectionPage extends PureComponent<Props, State> {
  public static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const {
      params: {id},
      services,
    } = nextProps

    if (prevState.formMode === FluxFormMode.new && id) {
      const service = services.find(s => {
        return s.id === id
      })
      return {
        ...prevState,
        service,
        formMode: FluxFormMode.edit,
      }
    }
    return null
  }
  constructor(props) {
    super(props)

    this.state = {
      service: null,
      formMode: FluxFormMode.new,
    }
  }

  public async componentDidMount() {
    const {
      source,
      params: {id},
    } = this.props

    let service: Service
    let formMode: FluxFormMode
    if (id) {
      try {
        service = await getService(source.links.services, id)
        formMode = FluxFormMode.edit
        this.setState({service, formMode})
      } catch (err) {
        console.error('Could not get Service', err)
      }
    } else {
      formMode = FluxFormMode.new
      this.setState({formMode})
    }
  }

  public render() {
    const {source, notify, createService, updateService, router} = this.props
    const {service, formMode} = this.state
    if (formMode === FluxFormMode.new) {
      return (
        <FluxNew
          source={source}
          notify={notify}
          router={router}
          createService={createService}
        />
      )
    } else {
      return (
        <FluxEdit
          notify={notify}
          service={service}
          updateService={updateService}
        />
      )
    }
  }
}

const mdtp = {
  notify: notifyAction,
  createService: createServiceAsync,
  updateService: updateServiceAsync,
}

const mstp = ({services}) => ({services})

export default connect(mstp, mdtp)(withRouter(FluxConnectionPage))
