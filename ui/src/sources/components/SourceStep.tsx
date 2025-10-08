/* eslint-disable no-empty */
// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'
import WizardDropdown from 'src/reusable_ui/components/wizard/WizardDropdown'

// Actions
import {
  addSource as addSourceAction,
  updateSource as updateSourceAction,
} from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createSource, updateSource} from 'src/shared/apis'

// Constants
import {
  notifySourceConnectionSucceeded,
  notifySourceCreationFailed,
  notifySourceUpdateFailed,
} from 'src/shared/copy/notifications'
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {
  DEFAULT_SOURCE,
  SOURCE_TYPE_INFLUX_V1,
  SOURCE_TYPE_INFLUX_V1_ENTERPRISE,
  SOURCE_TYPE_INFLUX_V1_RELAY,
  SOURCE_TYPE_INFLUX_V2,
  SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED,
  SOURCE_TYPE_INFLUX_V3_CLUSTERED,
  SOURCE_TYPE_INFLUX_V3_CORE,
  SOURCE_TYPE_INFLUX_V3_ENTERPRISE,
} from 'src/shared/constants'
import {SUPERADMIN_ROLE} from 'src/auth/roles'

// Types
import {Me, Source} from 'src/types'
import {NextReturn} from 'src/types/wizard'

const isNewSource = (source: Partial<Source>) => !source.id

interface Props {
  notify: typeof notifyAction
  addSource: typeof addSourceAction
  updateSource: typeof updateSourceAction
  setError: (b: boolean) => void
  source: Source
  onBoarding?: boolean
  me: Me
  isUsingAuth: boolean
}

interface State {
  source: Partial<Source>
  serverType?: string // server type dropdown value
}

class SourceStep extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    onBoarding: false,
  }
  constructor(props: Props) {
    super(props)
    const source = this.props.source || DEFAULT_SOURCE
    this.state = {
      source,
      serverType: this.getServerTypeFromSource(source),
    }
  }

  public next = async (): Promise<NextReturn> => {
    const {source} = this.state
    const {notify} = this.props

    if (isNewSource(source)) {
      try {
        const sourceFromServer = await createSource(source)
        this.props.addSource(sourceFromServer)
        notify(notifySourceConnectionSucceeded(source.name))
        return {error: false, payload: sourceFromServer}
      } catch (err) {
        notify(notifySourceCreationFailed(source.name, this.parseError(err)))
        return {error: true, payload: null}
      }
    } else {
      if (this.sourceIsEdited) {
        try {
          const sourceFromServer = await updateSource(source)
          this.props.updateSource(sourceFromServer)
          // if the url field is blurred on a new source, the source is already created with no alert best to give a neutral success message
          notify(notifySourceConnectionSucceeded(source.name))
          return {error: false, payload: sourceFromServer}
        } catch (err) {
          notify(notifySourceUpdateFailed(source.name, this.parseError(err)))
          return {error: true, payload: null}
        }
      }
      return {error: false, payload: source}
    }
  }

  public render() {
    const {source} = this.state
    const {isUsingAuth, onBoarding} = this.props
    return (
      <>
        {isUsingAuth && onBoarding && this.authIndicator}
        <WizardDropdown
          label="Server Type"
          placeholder="Select Server Type"
          value={this.state.serverType}
          options={[
            {
              value: SOURCE_TYPE_INFLUX_V1,
              label: 'InfluxDB v1',
            },
            {
              value: SOURCE_TYPE_INFLUX_V2,
              label: 'InfluxDB v2',
            },
            {
              value: SOURCE_TYPE_INFLUX_V3_CORE,
              label: 'InfluxDB 3 Core',
            },
            {
              value: SOURCE_TYPE_INFLUX_V3_ENTERPRISE,
              label: 'InfluxDB 3 Enterprise',
            },
            {
              value: SOURCE_TYPE_INFLUX_V3_CLUSTERED,
              label: 'InfluxDB Clustered',
            },
            // TODO simon: add InfluxDB Cloud Serverless
            {
              value: SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED,
              label: 'InfluxDB Cloud Dedicated',
            },
          ]}
          onChange={this.handleServerTypeChange}
          testId="server-type-selector--dropdown"
        />
        <WizardTextInput
          value={source.url}
          label="Connection URL"
          onChange={this.onChangeInput('url')}
          valueModifier={this.URLModifier}
          onSubmit={this.handleSubmitUrl}
          testId="connection-url--input"
        />
        <WizardTextInput
          value={source.name}
          label="Connection Name"
          onChange={this.onChangeInput('name')}
          testId="connection-name--input"
        />
        {(this.state.serverType === SOURCE_TYPE_INFLUX_V1 ||
          this.state.serverType === SOURCE_TYPE_INFLUX_V2) && (
          <>
            <WizardTextInput
              value={source.username}
              label={
                this.state.serverType === SOURCE_TYPE_INFLUX_V2
                  ? 'Organization'
                  : 'Username'
              }
              onChange={this.onChangeInput('username')}
              onSubmit={this.handleSubmitUsername}
              testId="connection-username--input"
            />
            <WizardTextInput
              value={source.password}
              label={
                this.state.serverType === SOURCE_TYPE_INFLUX_V2
                  ? 'Token'
                  : 'Password'
              }
              placeholder={this.passwordPlaceholder}
              type="password"
              onChange={this.onChangeInput('password')}
              onSubmit={this.handleSubmitPassword}
              testId="connection-password--input"
            />
          </>
        )}

        {/* InfluxDB 3 Core/Enterprise fields */}
        {(this.state.serverType === SOURCE_TYPE_INFLUX_V3_CORE ||
          this.state.serverType === SOURCE_TYPE_INFLUX_V3_ENTERPRISE) && (
          <>
            <WizardTextInput
              value={source.databaseToken}
              label={'Database Token'}
              type="password"
              onChange={this.onChangeInput('databaseToken')}
            />
          </>
        )}

        {/* InfluxDB Clustered fields */}
        {this.state.serverType === SOURCE_TYPE_INFLUX_V3_CLUSTERED && (
          <>
            <WizardTextInput
              value={source.managementToken}
              label={'Management Token'}
              type="password"
              onChange={this.onChangeInput('managementToken')}
            />
            <WizardTextInput
              value={source.databaseToken}
              label={'Database Token'}
              type="password"
              onChange={this.onChangeInput('databaseToken')}
            />
          </>
        )}

        {/* InfluxDB Cloud Dedicated fields */}
        {this.state.serverType === SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED && (
          <>
            <WizardTextInput
              value={source.clusterId}
              label={'Cluster ID'}
              onChange={this.onChangeInput('clusterId')}
            />
            <WizardTextInput
              value={source.accountId}
              label={'Account ID'}
              onChange={this.onChangeInput('accountId')}
            />
            <WizardTextInput
              value={source.managementToken}
              label={'Management Token'}
              type="password"
              onChange={this.onChangeInput('managementToken')}
            />
            <WizardTextInput
              value={source.databaseToken}
              label={'Database Token'}
              type="password"
              onChange={this.onChangeInput('databaseToken')}
            />
            <WizardTextInput
              value={source.tagsCSVPath}
              label={'Tags CSV Directory Path'}
              onChange={this.onChangeInput('tagsCSVPath')}
            />
          </>
        )}

        <WizardTextInput
          value={source.telegraf}
          label="Telegraf Database Name"
          onChange={this.onChangeInput('telegraf')}
        />
        <WizardTextInput
          value={source.defaultRP}
          label="Default Retention Policy"
          onChange={this.onChangeInput('defaultRP')}
        />
        {this.isEnterprise && (
          <WizardTextInput
            value={source.metaUrl}
            label="Meta Service Connection URL"
            onChange={this.onChangeInput('metaUrl')}
            testId="meta-service-connection-url--input"
          />
        )}
        {!onBoarding && (
          <WizardCheckbox
            halfWidth={false}
            isChecked={source.default}
            text={'Default connection'}
            onChange={this.onChangeInput('default')}
            testId="default-connection--checkbox"
          />
        )}

        {this.isHTTPS && (
          <WizardCheckbox
            isChecked={source.insecureSkipVerify}
            text={`Unsafe SSL`}
            onChange={this.onChangeInput('insecureSkipVerify')}
            subtext={insecureSkipVerifyText}
            testId="unsafe-ssl--checkbox"
          />
        )}
      </>
    )
  }

  private get passwordPlaceholder() {
    const {source} = this.props
    if (source && source.authentication === 'basic') {
      return 'Value saved in server'
    }
  }

  private get authIndicator(): JSX.Element {
    const {me} = this.props
    return (
      <div className="text-center">
        {me.role === SUPERADMIN_ROLE ? (
          <h4>
            The organization{' '}
            <strong>
              <i>{me.currentOrganization.name}</i>
            </strong>{' '}
            currently has no connections
          </h4>
        ) : (
          <h3>
            The organization{' '}
            <strong>
              <i>{me.currentOrganization.name}</i>
            </strong>{' '}
            has no connections available to <em>{me.role}s</em>
          </h3>
        )}
      </div>
    )
  }

  private URLModifier = (value: string): string => {
    const url = value.trim()
    if (url.startsWith('http')) {
      return url
    }
    return `http://${url}`
  }

  private parseError = (error): string => {
    return getDeep<string>(error, 'data.message', error)
  }

  private onChangeInput = (key: string) => (value: string | boolean) => {
    const {source} = this.state
    const {setError} = this.props
    this.setState({source: {...source, [key]: value}})
    setError(false)
  }
  private changeSourceType = (type: string, version: string) => {
    const {source} = this.state
    this.setState({
      source: {
        ...source,
        username: '',
        password: '',
        clusterId: '',
        accountId: '',
        managementToken: '',
        databaseToken: '',
        type,
        version,
      },
    })
  }

  private handleSubmitUrl = (url: string) => this.detectServerType({url})
  private handleSubmitUsername = (username: string) =>
    this.detectServerType({username})
  private handleSubmitPassword = (password: string) =>
    this.detectServerType({password})

  private detectServerType = async (changedField: Partial<Source>) => {
    const source = {
      ...this.state.source,
      ...changedField,
      insecureSkipVerify: true, // detect InfluxDB type with TLS server verification off
    }
    const metaserviceURL = new URL(source.metaUrl || DEFAULT_SOURCE.metaUrl)
    const sourceURL = new URL(source.url || DEFAULT_SOURCE.url)

    if (isNewSource(source)) {
      try {
        metaserviceURL.hostname = sourceURL.hostname
        const {type} = await createSource(source, {dryRun: ''})
        this.setState({
          source: {...this.state.source, type, metaUrl: metaserviceURL.href},
        })
      } catch (err) {}
    } else {
      try {
        const {type} = await updateSource(source, {dryRun: ''})
        this.setState({
          source: {...this.state.source, type},
        })
      } catch (err) {}
    }
  }

  private get sourceIsEdited(): boolean {
    const sourceInProps = this.props.source
    const sourceInState = this.state.source
    return !_.isEqual(sourceInProps, sourceInState)
  }

  private get isHTTPS(): boolean {
    const {source} = this.state
    return getDeep<string>(source, 'url', '').startsWith('https')
  }

  private get isEnterprise(): boolean {
    const {source} = this.state
    return _.get(source, 'type', '').includes('enterprise')
  }

  private getServerTypeFromSource = (
    source: Partial<Source>
  ): string | undefined => {
    if (
      source.type === SOURCE_TYPE_INFLUX_V1 ||
      source.type === SOURCE_TYPE_INFLUX_V2 ||
      source.type === SOURCE_TYPE_INFLUX_V3_CORE ||
      source.type === SOURCE_TYPE_INFLUX_V3_ENTERPRISE ||
      source.type === SOURCE_TYPE_INFLUX_V3_CLUSTERED ||
      source.type === SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED
    ) {
      return source.type
    }
    if (
      source.type === SOURCE_TYPE_INFLUX_V1_ENTERPRISE ||
      source.type === SOURCE_TYPE_INFLUX_V1_RELAY
    ) {
      // Special v1 subtypes are displayed as v1
      return SOURCE_TYPE_INFLUX_V1
    }
    return undefined
  }

  private handleServerTypeChange = (value: string) => {
    this.setState({serverType: value})

    switch (value) {
      case SOURCE_TYPE_INFLUX_V2:
        this.changeSourceType(value, '2.x')
        break
      case SOURCE_TYPE_INFLUX_V3_CORE:
        this.changeSourceType(value, '3.x')
        break
      case SOURCE_TYPE_INFLUX_V3_ENTERPRISE:
        this.changeSourceType(value, '3.x')
        break
      case SOURCE_TYPE_INFLUX_V3_CLUSTERED:
        this.changeSourceType(value, '3.x')
        break
      case SOURCE_TYPE_INFLUX_V3_CLOUD_DEDICATED:
        this.changeSourceType(value, 'cloud')
        break
      case SOURCE_TYPE_INFLUX_V1:
      default:
        this.changeSourceType(SOURCE_TYPE_INFLUX_V1, '1.x')
    }
  }
}

const mdtp = {
  notify: notifyAction,
  addSource: addSourceAction,
  updateSource: updateSourceAction,
}

export default connect(null, mdtp, null, {forwardRef: true})(
  ErrorHandling(SourceStep)
)
