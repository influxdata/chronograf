// Libraries
import React, {Component} from 'react'

// Components
import FormElement from 'src/reusable_ui/components/form_layout/FormElement'
import FormLabel from 'src/reusable_ui/components/form_layout/FormLabel'
import FormDivider from 'src/reusable_ui/components/form_layout/FormDivider'
import FormFooter from 'src/reusable_ui/components/form_layout/FormFooter'

// Styles
import './Form.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: JSX.Element[]
}

@ErrorHandling
class Form extends Component<Props> {
  public static Element = FormElement
  public static Label = FormLabel
  public static Divider = FormDivider
  public static Footer = FormFooter

  public render() {
    const {children} = this.props

    this.validateChildCount()

    return <div className="form--wrapper">{children}</div>
  }

  private validateChildCount = (): void => {
    const {children} = this.props

    if (React.Children.count(children) === 0) {
      throw new Error(
        'Form require at least 1 child element. We recommend using <Form.Element>'
      )
    }
  }
}

export default Form
