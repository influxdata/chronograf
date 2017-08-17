const src = process.argv.find(s => s.includes('--src=')).replace('--src=', '')
const dashboardsUrl = `http://localhost:8888/sources/${src}/dashboards`
const dashboardUrl = `http://localhost:8888/sources/${src}/dashboards`
// const dataTest = s => `[data-test="${s}"]`

module.exports = {
  Dashboards(browser) {
    browser
      // Navigate to Dashboards page
      .url(dashboardsUrl)
    // Create Dashboard #1
    // Create Dashboard #2
  },
  Dashboard(browser) {
    browser
      // Navigate to Dashboard #2
      .url(dashboardUrl)
    // Switch Dashboard to #1
    // Rename Dashboard
    // Rename Initial Cell
    // Add a New Cell
    // Delete the New Cell
  },
  TemplateVariables(browser) {
    browser
      // Navigate to Dashboard page
      .url(dashboardUrl)
    // Open TV menu and Manage TVs
  },
  CEO(browser) {
    browser
      // Navigate to Dashboard page
      .url(dashboardUrl)
  },
  DeleteDashboard() {
    // Delete Dashboard
  },
}
