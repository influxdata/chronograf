import React, {MouseEvent, PureComponent, useMemo, useState} from 'react'
import {Link} from 'react-router'
import {sortBy, take} from 'lodash'

import {AlertRule} from 'src/types'

import ConfirmButton from 'src/shared/components/ConfirmButton'
import {TASKS_TABLE} from 'src/kapacitor/constants/tableSizing'
const {colName, colType, colEnabled, colActions} = TASKS_TABLE

interface TasksTableProps {
  tasks: AlertRule[]
  kapacitorLink: string
  onChangeRuleStatus: (rule: AlertRule) => void
  onDelete: (rule: AlertRule) => void
  onViewRule?: (ruleId: string) => void
}

interface TaskRowProps {
  task: AlertRule
  editLink: string
  onChangeRuleStatus: (rule: AlertRule) => void
  onDelete: (rule: AlertRule) => void
  onViewRule?: (ruleId: string) => void
}

const PAGE_SIZE = 100

const TasksTable = ({
  tasks,
  kapacitorLink,
  onDelete,
  onChangeRuleStatus,
  onViewRule,
}: TasksTableProps) => {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const allData = useMemo(() => sortBy(tasks, t => t.name.toLowerCase()), [
    tasks,
  ])
  const tableData = useMemo(() => take(allData, limit), [allData, limit])
  return (
    <table className="table v-center table-highlight">
      <thead>
        <tr>
          <th style={{minWidth: colName}}>Name</th>
          <th style={{width: colType}}>Type</th>
          <th style={{width: colEnabled}} className="text-center">
            Task Enabled
          </th>
          <th style={{width: colActions}} />
        </tr>
      </thead>
      <tbody>
        {tableData.map(task => {
          return (
            <TaskRow
              key={task.id}
              task={task}
              editLink={`${kapacitorLink}/tickscripts/${task.id}`}
              onViewRule={onViewRule}
              onDelete={onDelete}
              onChangeRuleStatus={onChangeRuleStatus}
            />
          )
        })}
        {allData.length > limit ? (
          <tr>
            <td colSpan={4}>
              <button
                className="btn btn-sm btn-default btn-block"
                onClick={() => setLimit(limit + 100)}
              >
                {`Show next ${PAGE_SIZE} tasks`}
              </button>
            </td>
          </tr>
        ) : undefined}
      </tbody>
    </table>
  )
}

export class TaskRow extends PureComponent<TaskRowProps> {
  public render() {
    const {task, editLink} = this.props
    return (
      <tr key={task.id}>
        <td style={{minWidth: colName}}>
          <Link
            style={{color: task['template-id'] ? 'gray' : undefined}}
            className="link-success"
            to={editLink}
            data-task-id={task.id}
            onClick={this.handleViewRule}
          >
            {task.name}
          </Link>
        </td>
        <td style={{width: colType, textTransform: 'capitalize'}}>
          {task.type}
        </td>
        <td style={{width: colEnabled}} className="text-center">
          <div className="dark-checkbox">
            <input
              id={`kapacitor-task-row-task-enabled ${task.id}`}
              className="form-control-static"
              type="checkbox"
              checked={task.status === 'enabled'}
              onChange={this.handleClickRuleStatusEnabled}
            />
            <label htmlFor={`kapacitor-task-row-task-enabled ${task.id}`} />
          </div>
        </td>
        <td style={{width: colActions}} className="text-right">
          <ConfirmButton
            text="Delete"
            type="btn-danger"
            size="btn-xs"
            customClass="table--show-on-row-hover"
            confirmAction={this.handleDelete}
          />
        </td>
      </tr>
    )
  }

  private handleDelete = () => {
    const {onDelete, task} = this.props

    onDelete(task)
  }

  private handleClickRuleStatusEnabled = () => {
    const {onChangeRuleStatus, task} = this.props

    onChangeRuleStatus(task)
  }

  private handleViewRule = (e: MouseEvent) => {
    const {onViewRule} = this.props
    if (onViewRule) {
      e.preventDefault()
      // casting to unknown is a workaround to wrong global typings
      onViewRule(
        ((e.target as unknown) as any).attributes.getNamedItem('data-task-id')
          .value
      )
    }
  }
}

export default TasksTable
