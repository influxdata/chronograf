import React, {FunctionComponent} from 'react'
import {PageSection} from 'src/types/shared'

interface TabProps {
  handleClick: () => void
  section: PageSection
  activeSection: string
}

const SubSectionsTab: FunctionComponent<TabProps> = ({
  handleClick,
  section,
  activeSection,
}) => (
  <div
    className={`subsection--tab ${
      section.url === activeSection ? 'active' : ''
    }`}
    onClick={handleClick}
  >
    {section.name}
  </div>
)

export default SubSectionsTab
