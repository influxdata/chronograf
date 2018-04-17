const puppeteer = require('puppeteer')

const isDebugging = () => {
  const debuggingMode = {
    headless: false,
    slowMo: 0,
    devtools: false,
  }
  return process.env.NODE_ENV === 'debug' ? debuggingMode : {}
}

let browser
let page
beforeAll(async () => {
  browser = await puppeteer.launch(isDebugging())
  page = await browser.newPage()
  await page.goto('http://localhost:8888')
  page.setViewport({width: 500, height: 2400})
}, 16000)

describe('on page load ', () => {
  test(
    'Status text is correct',
    async () => {
      const html = await page.$eval('.page-header__title', e => e.innerHTML)

      expect(html).toBe('Status')

      browser.close()
    },
    16000
  )
})

afterAll(() => {
  if (isDebugging()) {
    browser.close()
  }
})
