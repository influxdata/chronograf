import React, {Component, ReactNode} from 'react'
import {withRouter, WithRouterProps} from 'react-router'

import SubSectionsTab from 'src/shared/components/SubSectionsTab'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {PageSection} from 'src/types/shared'
import NotFound from './NotFound'

interface ClassNames {
  top: string
  nav: string
  tabs: string
  content: string
}

const TOP: ClassNames = {
  top: 'subsection',
  nav: 'subsection--nav',
  tabs: 'subsection__tabs subsection__tabs--row',
  content: 'subsection--content',
}

const LEFT: ClassNames = {
  top: 'row subsection',
  nav: 'col-md-2 subsection--nav',
  tabs: 'subsection__tabs',
  content: 'col-md-10 subsection--content',
}
interface Props extends WithRouterProps {
  sections: PageSection[]
  activeSection: string
  sourceID: string
  parentUrl: string
  children?: ReactNode
  position?: 'left' | 'top'
}

@ErrorHandling
class SubSections extends Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const {sections, activeSection, position} = this.props
    const classes = position === 'top' ? TOP : LEFT

    return (
      <div className={classes.top}>
        <div className={classes.nav} data-test="subsectionNav">
          <div className={classes.tabs}>
            {sections.map(
              (section, i) =>
                section.enabled && (
                  <SubSectionsTab
                    key={i}
                    section={section}
                    handleClick={this.handleTabClick(section.url)}
                    activeSection={activeSection}
                  />
                )
            )}
          </div>
        </div>
        <div className={classes.content} data-test="subsectionContent">
          {this.activeSectionComponent}
        </div>
      </div>
    )
  }

  private get activeSectionComponent(): ReactNode {
    const {sections, activeSection, children} = this.props
    const found = sections.find(section => section.url === activeSection)
    return found?.component || children || <NotFound />
  }

  public handleTabClick = (url: string) => () => {
    const {router, sourceID, parentUrl} = this.props
    router.push(`/sources/${sourceID}/${parentUrl}/${url}`)
  }
}

export default withRouter(SubSections)
