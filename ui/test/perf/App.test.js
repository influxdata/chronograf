const puppeteer = require('puppeteer')

const isDebugging = () => {
  const debuggingMode = {
    headless: false,
    slowMo: 250,
    devtools: false,
  }
  return process.env.NODE_ENV === 'debug' ? debuggingMode : {}
}

let browser
let page
beforeAll(async () => {
  browser = await puppeteer.launch(isDebugging())
  page = await browser.newPage()

  await page.goto('http://localhost:8888/sources/2/dashboards/15')

  page.setViewport({width: 1000, height: 2400})
}, 16000)

describe('on page load ', () => {
  test(
    'Status text is correct',
    async () => {
      const html = await page.$eval('.dash-graph--name', e => e.innerHTML)

      expect(html).toBe('Untitled Cell')
      await page.tracing.start({path: '../trace3.json'})
      await page.mouse.move(500, 500, {steps: 10})
      await page.click('.dash-graph-context--button')
      await page.click('.dash-graph-context--menu-item')
      await page.waitForSelector('.overlay-controls')
      await page.tracing.stop()
      browser.close()
    },
    16001
  )
})

afterAll(() => {
  if (isDebugging()) {
    browser.close()
  }
})
