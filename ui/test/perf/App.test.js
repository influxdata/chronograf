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

      const client = page._client // client is chrome devtools protocol: https://chromedevtools.github.io/devtools-protocol
      const cats = await client.send('Tracing.getCategories') // send messages to chrome devtools client.
      console.log('cats', cats)

      expect(html).toBe('Untitled Cell')
      // await page.tracing.start({path: '../trace3.json'})
      // await page.mouse.move(500, 500, {steps: 10})
      // await page.click('.dash-graph-context--button')
      // await page.click('.dash-graph-context--menu-item')
      // await page.waitForSelector('.overlay-controls')
      // await page.tracing.stop()
      // const client = await page.target().createCDPSession()
      // await client.send('Performance.enable')
      // await client.send('Performance.getMetrics')

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

const traceSchema = {
  traceEvents: [
    {
      pid: x, // processid
      tid: x,
      ts: x,
      ph: x,
      cat: x,
      name: x, // name of the task
      args: {
        src_file: x,
        src_func: x,
        'data?': {
          cpuProfile: {
            samples: [n, n, n, n, n], // ns refer to node ids?
            timeDeltas: [n, n, n, n, n], // in ms.
            tts: x,
            id: x,
            'nodes?': [
              {
                parent: n,
                id: n,
                callFrame: {
                  functionName: 'root',
                  scriptId: x,
                  url: x,
                  scriptId: x,
                  lineNumber: x,
                  columnNumber: x,
                },
              },
            ],
          },
        },
      },
      dur: x,
      tdur: x,
      tts: x,
    },
  ],
  metadata: {},
}
37182
