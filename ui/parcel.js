const proxy = require('http-proxy-middleware')
const Bundler = require('parcel')
const express = require('express')

const port = Number(process.env.PORT || 8080)

console.log(`Serving on http://localhost:${port}`) // eslint-disable-line no-console

const app = express()
const bundler = new Bundler(['src/index.html', 'src/worker/worker.ts'], {
  outDir: './build/',
})

app.use(
  proxy('/chronograf/v1', {
    target: 'http://localhost:8888',
    logLevel: 'warn',
    changeOrigin: true,
  })
)

app.use(bundler.middleware())
app.listen(port)
