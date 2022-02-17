import {Dashboard} from 'src/types/dashboards'

export interface DashboardsResponse {
  dashboards: Dashboard[]
}

export type GetDashboards = () => Promise<{data: DashboardsResponse}>
export interface LoadLinksOptions {
  activeDashboard: Dashboard
  dashboardsAJAX?: GetDashboards
}
