/* eslint no-console: 0 */
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  const handleProxyError = err => {
    if (err.code === "ECONNREFUSED") {
      console.log(
        "Cannot reach Chronograf server at localhost:8888. Is it running?"
      );
    } else {
      console.log(`Error: ${err.code}`);
    }
  };
  const proxyMiddleware = createProxyMiddleware("/chronograf/v1", {
    target: "http://localhost:8888",
    logLevel: "silent",
    changeOrigin: true,
    onError: handleProxyError,
  });
  const proxyMiddlewareOAuth = createProxyMiddleware("/oauth", {
    target: "http://localhost:8888",
    logLevel: "silent",
    changeOrigin: true,
    onError: handleProxyError,
  });
  const port = Number(process.env.PORT || 8080);
  app.use(proxyMiddleware);
  app.use(proxyMiddlewareOAuth);
};
