// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import Visualization from 'src/dashboards/components/Visualization'
import InfluxQLQueryMaker from 'src/shared/components/TimeMachine/InfluxQLQueryMaker'
import DisplayOptions from 'src/dashboards/components/DisplayOptions'
import TimeMachineBottom from 'src/shared/components/TimeMachine/TimeMachineBottom'
import TimeMachineControls from 'src/shared/components/TimeMachine/TimeMachineControls'

// Utils
import {getConfig} from 'src/dashboards/utils/cellGetters'
import {getDeep} from 'src/utils/wrappers'

// Actions
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {HANDLE_HORIZONTAL} from 'src/shared/constants'
import {AUTO_GROUP_BY, PREDEFINED_TEMP_VARS} from 'src/shared/constants'
import {CEOTabs} from 'src/dashboards/constants'

// Types
import {
  QueryConfigActions,
  addQueryAsync,
  deleteQueryAsync,
} from 'src/dashboards/actions/cellEditorOverlay'
import {
  TimeRange,
  QueryConfig,
  Template,
  Source,
  Service,
  CellQuery,
} from 'src/types'
import {SourceOption} from 'src/types/sources'

interface Props {
  source: Source
  sources: Source[]
  isInCEO: boolean
  services: Service[]
  autoRefresh: number
  timeRange: TimeRange
  templates: Template[]
  isStaticLegend: boolean
  queryConfigActions: QueryConfigActions
  onResetFocus: () => void
  queryDrafts: CellQuery[]
  editQueryStatus: typeof editCellQueryStatus
  updateQueryDrafts: (queryDrafts: CellQuery[]) => void
  onToggleStaticLegend: (isStaticLegend: boolean) => () => void
  children: (
    activeEditorTab: CEOTabs,
    onSetActiveEditorTab: (activeEditorTab: CEOTabs) => void
  ) => JSX.Element
  addQuery: typeof addQueryAsync
  deleteQuery: typeof deleteQueryAsync
}

interface State {
  activeQueryIndex: number
  activeEditorTab: CEOTabs
  selectedSource: Source
  selectedService: Service
  useDynamicSource: boolean
}

class TimeMachine extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    const {queryDrafts} = props

    const useDynamicSource = getDeep(queryDrafts, '0.source', '') === ''

    this.state = {
      activeQueryIndex: 0,
      activeEditorTab: CEOTabs.Queries,
      selectedService: null,
      selectedSource: null,
      useDynamicSource,
    }
  }

  public render() {
    const {services} = this.props
    const {useDynamicSource} = this.state
    const horizontalDivisions = [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: () => this.visualization,
        headerOrientation: HANDLE_HORIZONTAL,
        size: 0.33,
      },
      {
        name: '',
        headerButtons: [],
        menuOptions: [],
        render: () => this.editorBottom,
        headerOrientation: HANDLE_HORIZONTAL,
        size: 0.67,
      },
    ]

    return (
      <div className="deceo">
        {this.pageHeader}
        <TimeMachineControls
          queries={this.queriesWorkingDraft}
          source={this.source}
          sources={this.formattedSources}
          service={this.service}
          services={services}
          onChangeService={this.handleChangeService}
          isDynamicSourceSelected={useDynamicSource}
        />
        <div className="deceo--container">
          <Threesizer
            orientation={HANDLE_HORIZONTAL}
            divisions={horizontalDivisions}
          />
        </div>
      </div>
    )
  }

  private get visualization() {
    const {
      timeRange,
      templates,
      autoRefresh,
      editQueryStatus,
      isInCEO,
      source,
      isStaticLegend,
    } = this.props

    return (
      <div className="deceo--top">
        <Visualization
          source={source}
          timeRange={timeRange}
          templates={templates}
          autoRefresh={autoRefresh}
          queryConfigs={this.queriesWorkingDraft}
          editQueryStatus={editQueryStatus}
          staticLegend={isStaticLegend}
          isInCEO={isInCEO}
        />
      </div>
    )
  }

  private get editorBottom(): JSX.Element {
    return <TimeMachineBottom>{this.editorTab}</TimeMachineBottom>
  }

  private get editorTab() {
    const {
      templates,
      timeRange,
      isStaticLegend,
      onToggleStaticLegend,
    } = this.props
    const {activeQueryIndex, activeEditorTab} = this.state

    if (activeEditorTab === CEOTabs.Queries) {
      return (
        <InfluxQLQueryMaker
          source={this.source}
          templates={templates}
          queries={this.queriesWorkingDraft}
          actions={this.queryConfigActions}
          timeRange={timeRange}
          onDeleteQuery={this.handleDeleteQuery}
          onAddQuery={this.handleAddQuery}
          activeQueryIndex={activeQueryIndex}
          activeQuery={this.getActiveQuery()}
          setActiveQueryIndex={this.handleSetActiveQueryIndex}
          initialGroupByTime={AUTO_GROUP_BY}
        />
      )
    }

    return (
      <DisplayOptions
        queryConfigs={this.queriesWorkingDraft}
        onToggleStaticLegend={onToggleStaticLegend}
        staticLegend={isStaticLegend}
        onResetFocus={this.props.onResetFocus}
      />
    )
  }

  private get pageHeader(): JSX.Element {
    const {children} = this.props
    const {activeEditorTab} = this.state

    return children(activeEditorTab, this.handleSetActiveEditorTab)
  }

  private get service() {
    const {selectedService} = this.state

    return selectedService
  }

  private get source(): Source {
    const {source, sources, queryDrafts} = this.props
    const {selectedSource, useDynamicSource} = this.state

    if (selectedSource) {
      return selectedSource
    }

    // return current source
    if (useDynamicSource) {
      return source
    }

    const queryDraft = _.get(queryDrafts, 0)
    const querySource = _.get(queryDraft, 'source')

    if (!queryDraft || !querySource) {
      return source
    }

    // return source from queryDraft
    const foundSource = sources.find(
      s => s.links.self === _.get(queryDraft, 'source', null)
    )
    if (foundSource) {
      return foundSource
    }

    return source
  }

  private get queriesWorkingDraft(): QueryConfig[] {
    const {queryDrafts} = this.props

    return queryDrafts.map(q => ({
      ...q.queryConfig,
      source: this.source,
    }))
  }

  private get formattedSources(): SourceOption[] {
    const {sources} = this.props
    return sources.map(s => ({
      ...s,
      text: `${s.name} @ ${s.url}`,
    }))
  }

  private getActiveQuery = (): QueryConfig => {
    const {activeQueryIndex} = this.state

    const queriesWorkingDraft = this.queriesWorkingDraft
    const activeQuery = _.get(
      queriesWorkingDraft,
      activeQueryIndex,
      queriesWorkingDraft[0]
    )

    const queryText = _.get(activeQuery, 'rawText', '')
    const userDefinedTempVarsInQuery = this.findUserDefinedTempVarsInQuery(
      queryText,
      this.props.templates
    )

    if (!!userDefinedTempVarsInQuery.length) {
      activeQuery.isQuerySupportedByExplorer = false
    }

    return activeQuery
  }

  private findUserDefinedTempVarsInQuery = (
    query: string,
    templates: Template[]
  ): Template[] => {
    return templates.filter((temp: Template) => {
      if (!query) {
        return false
      }
      const isPredefinedTempVar: boolean = !!PREDEFINED_TEMP_VARS.find(
        t => t === temp.tempVar
      )
      if (!isPredefinedTempVar) {
        return query.includes(temp.tempVar)
      }
      return false
    })
  }

  private get queryConfigActions() {
    const {queryConfigActions} = this.props

    return {...queryConfigActions, editRawTextAsync: this.handleEditRawText}
  }

  // The schema explorer is not built to handle user defined template variables
  // in the query in a clear manner. If they are being used, we indicate that in
  // the query config in order to disable the fields column down stream because
  // at this point the query string is disconnected from the schema explorer.
  private handleEditRawText = async (text: string): Promise<void> => {
    const {templates, updateQueryDrafts, queryDrafts} = this.props

    const id = this.getActiveQuery().id
    const url = getDeep<string>(this.source, 'links.queries', '')

    const userDefinedTempVarsInQuery = this.findUserDefinedTempVarsInQuery(
      text,
      templates
    )

    const isUsingUserDefinedTempVars: boolean = !!userDefinedTempVarsInQuery.length

    try {
      const newQueryConfig = await getConfig(url, id, text, templates)
      const nextQueries = queryDrafts.map(q => {
        const {queryConfig} = q
        if (queryConfig.id === id) {
          const isQuerySupportedByExplorer = !isUsingUserDefinedTempVars

          if (isUsingUserDefinedTempVars) {
            return {
              ...q,
              queryConfig: {
                ...queryConfig,
                rawText: text,
                status: {loading: true},
                isQuerySupportedByExplorer,
              },
              query: text,
              text,
            }
          }

          // preserve query range and groupBy
          return {
            ...q,
            queryConfig: {
              ...newQueryConfig,
              status: {loading: true},
              rawText: text,
              range: queryConfig.range,
              groupBy: queryConfig.groupBy,
              source: queryConfig.source,
              isQuerySupportedByExplorer,
            },
            query: text,
            text,
          }
        }

        return q
      })
      updateQueryDrafts(nextQueries)
    } catch (error) {
      console.error(error)
    }
  }

  private handleChangeService = (
    selectedService: Service,
    selectedSource: Source
  ): void => {
    const {queryDrafts, updateQueryDrafts} = this.props

    const useDynamicSource: boolean =
      selectedService === null && selectedSource === null

    const queries: CellQuery[] = queryDrafts.map(q => {
      const queryConfig = _.get(q, 'queryConfig')
      return {
        ...q,
        queryConfig: {...queryConfig, source: selectedSource},
        source: getDeep<string>(selectedSource, 'links.self', ''),
      }
    })

    updateQueryDrafts(queries)
    this.setState({selectedService, selectedSource, useDynamicSource})
  }

  private handleAddQuery = () => {
    const {queryDrafts, addQuery} = this.props
    const newIndex = queryDrafts.length

    addQuery()
    this.handleSetActiveQueryIndex(newIndex)
  }

  private handleDeleteQuery = (index: number) => {
    const {queryDrafts, deleteQuery} = this.props
    const queryToDelete = queryDrafts.find((__, i) => i === index)
    const activeQuery = this.getActiveQuery()
    const activeQueryIndex = queryDrafts.findIndex(
      query => query.id === activeQuery.id
    )
    let newIndex: number
    if (index === activeQueryIndex) {
      if (index - 1 >= 0) {
        newIndex = index - 1
      } else if (index - 1 < 0 && queryDrafts.length > 1) {
        newIndex = index
      } else {
        newIndex = null
      }
    } else if (activeQueryIndex < index) {
      newIndex = activeQueryIndex
    } else {
      newIndex = activeQueryIndex - 1
    }

    this.handleSetActiveQueryIndex(newIndex)
    deleteQuery(queryToDelete.id)
  }

  private handleSetActiveQueryIndex = (activeQueryIndex): void => {
    this.setState({activeQueryIndex})
  }

  private handleSetActiveEditorTab = (tabName: CEOTabs): void => {
    this.setState({activeEditorTab: tabName})
  }
}

export default TimeMachine
