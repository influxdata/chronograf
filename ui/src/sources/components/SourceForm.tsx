// Libraries
import React, {PureComponent, FocusEvent, MouseEvent, ChangeEvent} from 'react'
import classnames from 'classnames'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import Form from 'src/reusable_ui/components/form_layout/Form'

// Constants
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {SUPERADMIN_ROLE} from 'src/auth/Authorized'

// Types
import {Columns} from 'src/reusable_ui/types'
import {Source, Role, Organization} from 'src/types'

interface Me {
  role: Role
  currentOrganization: Organization
}

interface Props {
  me: Me
  source: Partial<Source>
  editMode: boolean
  isUsingAuth: boolean
  gotoPurgatory: () => void
  isInitialSource: boolean
  onSubmit: (e: MouseEvent<HTMLFormElement>) => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlurSourceURL: (e: FocusEvent<HTMLInputElement>) => void
}

export class SourceForm extends PureComponent<Props> {
  public render() {
    const {
      source,
      onSubmit,
      isUsingAuth,
      onInputChange,
      gotoPurgatory,
      onBlurSourceURL,
      isInitialSource,
    } = this.props
    return (
      <div className="panel-body">
        {isUsingAuth && isInitialSource && this.authIndicator}
        <form onSubmit={onSubmit}>
          <Form>
            <Form.Element label="Connection String" colsSM={Columns.Six}>
              <input
                type="text"
                name="url"
                className="form-control"
                id="connect-string"
                placeholder="Address of InfluxDB"
                onChange={onInputChange}
                value={source.url}
                onBlur={onBlurSourceURL}
                required={true}
              />
            </Form.Element>
            <Form.Element label="Name" colsSM={Columns.Six}>
              <input
                type="text"
                name="name"
                className="form-control"
                id="name"
                placeholder="Name this source"
                onChange={onInputChange}
                value={source.name}
                required={true}
              />
            </Form.Element>
            <Form.Element label="Username" colsSM={Columns.Six}>
              <input
                type="text"
                name="username"
                className="form-control"
                id="username"
                onChange={onInputChange}
                value={source.username}
              />
            </Form.Element>
            <Form.Element label="Password" colsSM={Columns.Six}>
              <input
                type="password"
                name="password"
                className="form-control"
                id="password"
                onChange={onInputChange}
                value={source.password}
              />
            </Form.Element>
            {this.isEnterprise && (
              <Form.Element
                label="Meta Service Connection URL"
                colsSM={Columns.Twelve}
              >
                <input
                  type="text"
                  name="metaUrl"
                  className="form-control"
                  id="meta-url"
                  placeholder="http://localhost:8091"
                  onChange={onInputChange}
                  value={source.metaUrl}
                />
              </Form.Element>
            )}
            <Form.Element label="Telegraf Database" colsSM={Columns.Six}>
              <input
                type="text"
                name="telegraf"
                className="form-control"
                id="telegraf"
                onChange={onInputChange}
                value={source.telegraf}
              />
            </Form.Element>
            <Form.Element label="Default Retention Policy" colsSM={Columns.Six}>
              <input
                type="text"
                name="defaultRP"
                className="form-control"
                id="defaultRP"
                onChange={onInputChange}
                value={source.defaultRP}
              />
            </Form.Element>
            <Form.Element colsSM={Columns.Twelve}>
              <div className="form-control-static">
                <input
                  type="checkbox"
                  id="defaultConnectionCheckbox"
                  name="default"
                  checked={source.default}
                  onChange={onInputChange}
                />
                <label htmlFor="defaultConnectionCheckbox">
                  Make this the default connection
                </label>
              </div>
            </Form.Element>
            {this.isHTTPS && (
              <Form.Element
                colsSM={Columns.Twelve}
                helpText={insecureSkipVerifyText}
              >
                <div className="form-control-static">
                  <input
                    type="checkbox"
                    id="insecureSkipVerifyCheckbox"
                    name="insecureSkipVerify"
                    checked={source.insecureSkipVerify}
                    onChange={onInputChange}
                  />
                  <label htmlFor="insecureSkipVerifyCheckbox">Unsafe SSL</label>
                </div>
              </Form.Element>
            )}
            <Form.Footer colsSM={Columns.Six} offsetSM={Columns.Three}>
              <button className={this.submitClass} type="submit">
                <span className={this.submitIconClass} />
                {this.submitText}
              </button>
              {isUsingAuth && (
                <button className="btn btn-link btn-sm" onClick={gotoPurgatory}>
                  <span className="icon shuffle" /> Switch Orgs
                </button>
              )}
            </Form.Footer>
          </Form>
        </form>
      </div>
    )
  }

  private get authIndicator(): JSX.Element {
    const {me} = this.props
    return (
      <div className="text-center">
        {me.role.name === SUPERADMIN_ROLE ? (
          <h3>
            <strong>{me.currentOrganization.name}</strong> has no connections
          </h3>
        ) : (
          <h3>
            <strong>{me.currentOrganization.name}</strong> has no connections
            available to <em>{me.role}s</em>
          </h3>
        )}
        <h6>Add a Connection below:</h6>
      </div>
    )
  }

  private get submitText(): string {
    const {editMode} = this.props
    if (editMode) {
      return 'Save Changes'
    }

    return 'Add Connection'
  }

  private get submitIconClass(): string {
    const {editMode} = this.props
    return `icon ${editMode ? 'checkmark' : 'plus'}`
  }

  private get submitClass(): string {
    const {editMode} = this.props
    return classnames('btn btn-block', {
      'btn-primary': editMode,
      'btn-success': !editMode,
    })
  }

  private get isEnterprise(): boolean {
    const {source} = this.props
    return _.get(source, 'type', '').includes('enterprise')
  }

  private get isHTTPS(): boolean {
    const {source} = this.props
    return _.get(source, 'url', '').startsWith('https')
  }
}

const mapStateToProps = ({auth: {isUsingAuth, me}}) => ({isUsingAuth, me})

export default connect(mapStateToProps)(SourceForm)
