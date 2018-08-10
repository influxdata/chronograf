import React, {SFC} from 'react'
import {connect} from 'react-redux'

import {Dropdown} from 'src/reusable_ui'

import {setDisplaySetting} from 'src/shared/actions/annotations'

import {AnnotationsDisplaySetting} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

interface Props {
  displaySetting: AnnotationsDisplaySetting
  onSetDisplaySetting: (s: AnnotationsDisplaySetting) => void
}

const DROPDOWN_WIDTH = 210

const AnnotationsDisplaySettingDropdown: SFC<Props> = ({
  displaySetting,
  onSetDisplaySetting,
}) => {
  return (
    <Dropdown
      widthPixels={DROPDOWN_WIDTH}
      onChange={onSetDisplaySetting}
      selectedID={displaySetting}
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

const mstp = (state: {annotations: AnnotationState}) => ({
  displaySetting: state.annotations.displaySetting,
})

const mdtp = {
  onSetDisplaySetting: setDisplaySetting,
}

export default connect(mstp, mdtp)(AnnotationsDisplaySettingDropdown)
