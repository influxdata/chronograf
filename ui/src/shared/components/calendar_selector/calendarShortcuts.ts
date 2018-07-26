import moment from 'moment'

export interface CalendarShortcut {
  id: string
  name: string
  lower: moment.Moment
}

export const calendarShortcuts: CalendarShortcut[] = [
  {
    id: 'calendarSelectorPastWeek',
    name: 'Past Week',
    lower: moment().subtract(1, 'week'),
  },
  {
    id: 'calendarSelectorPastMonth',
    name: 'Past Month',
    lower: moment().subtract(1, 'month'),
  },
  {
    id: 'calendarSelectorPastYear',
    name: 'Past Year',
    lower: moment().subtract(1, 'year'),
  },
  {
    id: 'calendarSelectorThisWeek',
    name: 'This Week',
    lower: moment().startOf('week'),
  },
  {
    id: 'calendarSelectorThisMonth',
    name: 'This Month',
    lower: moment().startOf('month'),
  },
  {
    id: 'calendarSelectorThisYear',
    name: 'This Year',
    lower: moment().startOf('year'),
  },
]
