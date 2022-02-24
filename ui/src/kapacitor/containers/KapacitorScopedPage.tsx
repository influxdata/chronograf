// Libraries
import React, {MouseEvent, PureComponent} from 'react'
import {connect} from 'react-redux'

// APIs
import {getKapacitors, pingKapacitor} from 'src/shared/apis'

// Utils
import {notifyKapacitorConnectionFailed} from 'src/shared/copy/notifications'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {setActiveKapacitorAsync} from 'src/shared/actions/sources'

// Components
import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'
import {Page, Spinner} from 'src/reusable_ui'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'

// Types
import {Source, Kapacitor, RemoteDataState} from 'src/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'
import NoKapacitorError from 'src/shared/components/NoKapacitorError'

interface Props {
  // connected props
  notify: typeof mdtp.notify
  setActiveKapacitor: typeof mdtp.setActiveKapacitor

  // own props
  title: string
  source: Source
  tooltip?: string
  children: (
    kapacitor: Kapacitor,
    source: Source,
    scrollToTop: (scrollTop: number) => void
  ) => JSX.Element
}

interface State {
  loading: RemoteDataState
  scrollTop: number
  kapacitors?: Kapacitor[]
  kapacitor?: Kapacitor
  error?: Error
}

@ErrorHandling
export class KapacitorScopedPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: RemoteDataState.NotStarted,
      scrollTop: 0,
    }
  }

  public componentDidMount() {
    const {source} = this.props
    this.setState({loading: RemoteDataState.Loading})
    getKapacitors(source).then(kapacitors => {
      const kapacitor =
        kapacitors && kapacitors.length
          ? kapacitors.find(x => x.active) || kapacitors[0]
          : undefined
      if (kapacitor) {
        pingKapacitor(kapacitor).catch(() => {
          this.props.notify(notifyKapacitorConnectionFailed())
        })
      }
      this.setState({kapacitors, kapacitor, loading: RemoteDataState.Done})
    })
  }

  public render() {
    const {tooltip, title, source, children} = this.props
    const {loading, kapacitor, kapacitors, scrollTop} = this.state
    return (
      <Page className={kapacitor ? '' : 'empty-tasks-page'}>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title={kapacitor ? `${title} on` : title} />
            {kapacitor ? (
              <Dropdown
                customClass="kapacitor-switcher"
                onChange={this.handleSetActiveKapacitor}
                widthPixels={330}
                selectedID={kapacitor.id}
              >
                {kapacitors.map(k => (
                  <Dropdown.Item key={k.id} id={k.id} value={k.id}>
                    {`${k.name} @ ${k.url}`}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            ) : undefined}
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            {tooltip ? (
              <QuestionMarkTooltip
                tipID="manage-tasks--tooltip"
                tipContent={tooltip}
              />
            ) : undefined}
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents
          setScrollTop={this.handleScrollbarScroll}
          scrollTop={scrollTop}
        >
          <Spinner loading={loading}>
            {kapacitor ? (
              children(kapacitor, source, this.scrollToTop)
            ) : (
              <NoKapacitorError source={source} />
            )}
          </Spinner>
        </Page.Contents>
      </Page>
    )
  }

  private handleSetActiveKapacitor = async (
    kapacitorID: string
  ): Promise<void> => {
    const {setActiveKapacitor} = this.props
    const {kapacitors} = this.state
    const toKapacitor = kapacitors.find(k => k.id === kapacitorID)
    setActiveKapacitor(toKapacitor)
    pingKapacitor(toKapacitor).catch(() => {
      this.props.notify(notifyKapacitorConnectionFailed())
    })
  }
  private handleScrollbarScroll = (e: MouseEvent<HTMLElement>): void => {
    e.stopPropagation()
    e.preventDefault()
    const target = e.currentTarget
    this.setState({scrollTop: target.scrollTop})
  }
  private scrollToTop = (scrollTop: number) => {
    this.setState({scrollTop})
  }
}

const mdtp = {
  notify: notifyAction,
  setActiveKapacitor: setActiveKapacitorAsync,
}

export default connect(null, mdtp)(KapacitorScopedPage)
