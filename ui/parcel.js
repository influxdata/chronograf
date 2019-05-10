/* eslint no-console: 0 */
const proxy = require('http-proxy-middleware')
const Bundler = require('parcel')
const express = require('express')

const handleProxyError = err => {
  if (err.code === 'ECONNREFUSED') {
    console.log(
      'Cannot reach Chronograf server at localhost:8888. Is it running?'
    )
  } else {
    console.log(`Error: ${err.code}`)
  }
}

const proxyMiddleware = proxy('/chronograf/v1', {
  target: 'http://localhost:8888',
  logLevel: 'silent',
  changeOrigin: true,
  onError: handleProxyError,
})

const bundler = new Bundler('src/index.html', {outDir: './build/'})
const port = Number(process.env.PORT || 1111)
const app = express()

console.log(`Serving on http://localhost:${port}`)

app.use(proxyMiddleware)
app.use(bundler.middleware())
app.listen(port)
