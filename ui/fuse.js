const {
  FuseBox,
  EnvPlugin,
  SVGPlugin,
  CSSPlugin,
  JSONPlugin,
  SassPlugin,
  QuantumPlugin,
  WebIndexPlugin,
  Sparky,
} = require('fuse-box')

const {version} = require('./package.json')

let fuse, app, isProduction

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src',
    sourceMaps: !isProduction,
    hash: isProduction,
    target: 'browser',
    output: 'build/$name.js',
    useTypescriptCompiler: true,
    experimentalFeatures: true,
    globals: {
      VERSION: JSON.stringify(version),
    },
    plugins: [
      EnvPlugin({
        NODE_ENV: isProduction ? 'production' : 'development',
      }),
      SVGPlugin(),
      SassPlugin({
        sourceMap: false, // https://github.com/sass/libsass/issues/2312
      }),
      CSSPlugin(),
      JSONPlugin(),
      WebIndexPlugin({
        template: 'src/index.template.html',
      }),
      isProduction &&
        QuantumPlugin({
          treeshake: true,
          uglify: true,
        }),
    ],
    cache: true,
    log: true,
    debug: true,
    tsConfig: 'tsconfig.json',
    polyfillNonStandardDefaultUsage: true,
    alias: {
      admin: '~/admin',
      alerts: '~/alerts',
      auth: '~/auth',
      dashboards: '~/dashboards',
      data_explorer: '~/data_explorer',
      external: '~/external',
      hosts: '~/hosts',
      influxql: '~/influxql',
      kapacitor: '~/kapacitor',
      normalizers: '~/normalizers',
      shared: '~/shared',
      side_nav: '~/side_nav',
      sources: '~/sources',
      status: '~/status',
      store: '~/store',
      style: '~/style',
      utils: '~/utils',
    },
  })

  // vendor
  fuse.bundle('vendor').instructions('~ index.tsx')

  // bundle app
  app = fuse.bundle('app').instructions('> [index.tsx]')
})

Sparky.task('default', ['clean', 'config'], () => {
  fuse.dev({
    port: 4444,
    open: true,
    // httpServer: false,
    proxy: {
      '/chronograf/v1': {
        target: 'http://localhost:8888',
        // changeOrigin: true,
        // pathRewrite: {
        //   '^/chronograf/v1/': '/chronograf/v1/',
        // },
      },
    },
  })
  app.watch().hmr({reload: true})
  return fuse.run()
})

Sparky.task('clean', () => Sparky.src('build/').clean('build/'))

Sparky.task('prod-env', ['clean'], () => {
  isProduction = true
})

Sparky.task('build', ['prod-env', 'config'], () => {
  return fuse.run()
})
