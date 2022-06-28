import React, {FunctionComponent} from 'react'
import {connect} from 'react-redux'

import {Dropdown} from 'src/reusable_ui'

import {setAnnotationsDisplaySetting} from 'src/shared/actions/annotations'

import {AnnotationsDisplaySetting} from 'src/types/annotations'

interface Props {
  annotationsDisplaySetting: AnnotationsDisplaySetting
  onSetDisplaySetting: (s: AnnotationsDisplaySetting) => void
}

const DROPDOWN_WIDTH = 210

const AnnotationsDisplaySettingDropdown: FunctionComponent<Props> = ({
  annotationsDisplaySetting,
  onSetDisplaySetting,
}) => {
  return (
    <Dropdown
      widthPixels={DROPDOWN_WIDTH}
      onChange={onSetDisplaySetting}
      selectedID={annotationsDisplaySetting}
    >
      <Dropdown.Item
        id={AnnotationsDisplaySetting.HideAnnotations}
        value={AnnotationsDisplaySetting.HideAnnotations}
      >
        Hide Annotations
      </Dropdown.Item>
      <Dropdown.Item
        id={AnnotationsDisplaySetting.FilterAnnotationsByTag}
        value={AnnotationsDisplaySetting.FilterAnnotationsByTag}
      >
        Filter Annotations By Tags
      </Dropdown.Item>
    </Dropdown>
  )
}

const mstp = (state: {
  app: {persisted: {annotationsDisplaySetting: AnnotationsDisplaySetting}}
}) => ({
  annotationsDisplaySetting: state.app.persisted.annotationsDisplaySetting,
})

const mdtp = {
  onSetDisplaySetting: setAnnotationsDisplaySetting,
}

export default connect(mstp, mdtp)(AnnotationsDisplaySettingDropdown)
