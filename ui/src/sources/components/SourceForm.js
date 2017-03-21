import React, {PropTypes} from 'react'
import classNames from 'classnames'
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import _ from 'lodash'

const {
  bool,
  func,
  shape,
} = PropTypes

export const SourceForm = React.createClass({
  propTypes: {
    addFlashMessage: func.isRequired,
    addSourceAction: func,
    updateSourceAction: func,
    source: shape({}).isRequired,
    editMode: bool.isRequired,
    onInputChange: func.isRequired,
    onSubmit: func.isRequired,
    onBlurSourceURL: func.isRequired,
  },

  handleSubmitForm(e) {
    e.preventDefault()
    const newSource = {
      ...this.props.source,
      url: this.sourceURL.value.trim(),
      name: this.sourceName.value,
      username: this.sourceUsername.value,
      password: this.sourcePassword.value,
      'default': this.sourceDefault.checked,
      telegraf: this.sourceTelegraf.value,
      insecureSkipVerify: this.sourceInsecureSkipVerify ? this.sourceInsecureSkipVerify.checked : false,
      metaUrl: this.metaUrl && this.metaUrl.value.trim(),
    }

    this.props.onSubmit(newSource)
  },

  handleBlurSourceURL() {
    const url = this.sourceURL.value.trim()

    if (!url) {
      return
    }

    const newSource = {
      ...this.props.source,
      url: this.sourceURL.value.trim(),
    }

    this.props.onBlurSourceURL(newSource)
  },

  render() {
    const {source, editMode, onInputChange} = this.props;

    if (editMode && !source.id) {
      return <div className="page-spinner"></div>
    }

    return (
      <div className="page" id="source-form-page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1>
                {editMode ? "Edit Source" : "Add a New Source"}
              </h1>
            </div>
          </div>
        </div>
        <div className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-8 col-md-offset-2">
                <div className="panel panel-minimal">
                  <div className="panel-body">
                    <h4 className="text-center">Connection Details</h4>
                    <br/>

                    <form onSubmit={this.handleSubmitForm}>
                      <div className="form-group col-xs-12 col-sm-6">
                        <label htmlFor="connect-string"> Connection String</label>
                        <input type="text" name="url" ref={(r) => this.sourceURL = r} className="form-control" id="connect-string" placeholder="http://localhost:8086" onChange={onInputChange} value={source.url || ''} onBlur={this.handleBlurSourceURL}></input>
                      </div>
                      <div className="form-group col-xs-12 col-sm-6">
                        <label htmlFor="name">Name</label>
                        <input type="text" name="name" ref={(r) => this.sourceName = r} className="form-control" id="name" placeholder="Influx 1" onChange={onInputChange} value={source.name || ''}></input>
                      </div>
                      <div className="form-group col-xs-12 col-sm-6">
                        <label htmlFor="username">Username</label>
                        <input type="text" name="username" ref={(r) => this.sourceUsername = r} className="form-control" id="username" onChange={onInputChange} value={source.username || ''}></input>
                      </div>
                      <div className="form-group col-xs-12 col-sm-6">
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" ref={(r) => this.sourcePassword = r} className="form-control" id="password" onChange={onInputChange} value={source.password || ''}></input>
                      </div>
                      {_.get(source, 'type', '').includes("enterprise") ?
                          <div className="form-group col-xs-12">
                            <label htmlFor="meta-url">Meta Service Connection URL</label>
                            <input type="text" name="metaUrl" ref={(r) => this.metaUrl = r} className="form-control" id="meta-url" placeholder="http://localhost:8091" onChange={onInputChange} value={source.metaUrl || ''}></input>
                          </div> : null}
                      <div className="form-group col-xs-12">
                        <label htmlFor="telegraf">Telegraf database</label>
                        <input type="text" name="telegraf" ref={(r) => this.sourceTelegraf = r} className="form-control" id="telegraf" onChange={onInputChange} value={source.telegraf || 'telegraf'}></input>
                      </div>
                      <div className="form-group col-xs-12">
                        <div className="form-control-static">
                          <input type="checkbox" id="defaultSourceCheckbox" defaultChecked={source.default} ref={(r) => this.sourceDefault = r} />
                          <label htmlFor="defaultSourceCheckbox">Make this the default source</label>
                        </div>
                      </div>
                      {_.get(source, 'url', '').startsWith("https") ?
                        <div className="form-group col-xs-12">
                          <div className="form-control-static">
                            <input type="checkbox" id="insecureSkipVerifyCheckbox" defaultChecked={source.insecureSkipVerify} ref={(r) => this.sourceInsecureSkipVerify = r} />
                            <label htmlFor="insecureSkipVerifyCheckbox">Unsafe SSL</label>
                          </div>
                          <label className="form-helper">{insecureSkipVerifyText}</label>
                        </div> : null}
                      <div className="form-group form-group-submit col-xs-12 col-sm-6 col-sm-offset-3">
                        <button className={classNames('btn btn-block', {'btn-primary': editMode, 'btn-success': !editMode})} type="submit">{editMode ? "Save Changes" : "Add Source"}</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
})

export default SourceForm
