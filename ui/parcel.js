const proxy = require('http-proxy-middleware')
const Bundler = require('parcel-bundler')
const express = require('express')

const port = Number(process.env.PORT || 1234)

console.log(`Serving on http://localhost:${port}`) // eslint-disable-line no-console

const app = express()
const bundler = new Bundler('src/index.html', {
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
