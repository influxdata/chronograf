const {
  FuseBox,
  EnvPlugin,
  SassPlugin,
  PostCSSPlugin,
  CSSPlugin,
  JSONPlugin,
  QuantumPlugin,
  WebIndexPlugin,
  Sparky,
} = require('fuse-box')
const fs = require('fs')
const path = require('path')
const proxy = require('http-proxy-middleware')
const {version} = require('./package.json')
const {TypeHelper} = require('fuse-box-typechecker')

let fuse, app, isProduction

const typeHelper = TypeHelper({
  tsConfig: './tsconfig.json',
  basePath: './',
  tsLint: './tslint.json',
  name: 'App Linter',
  throwOnOptions: false,
  throwOnSyntactic: true,
  shortenFilenames: true,
  yellowOnLint: true,
})

const StylePlugins = [
  SassPlugin({
    sourceMap: false, // https://github.com/sass/libsass/issues/2312
    outputStyle: isProduction ? 'compressed' : 'expanded',
    importer: true,
    cache: false,
  }),
  PostCSSPlugin([require('autoprefixer'), require('cssnano')], {
    sourceMaps: false,
  }),
  CSSPlugin({
    group: 'chronograf.css',
    outFile: 'build/assets/chronograf.css',
    inject: false,
  }),
]

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src',
    sourceMaps: !isProduction,
    hash: false,
    target: 'browser',
    output: 'build/assets/$name.js',
    useTypescriptCompiler: true,
    polyfillNonStandardDefaultUsage: true,
    plugins: [
      JSONPlugin(),
      WebIndexPlugin({
        template: 'src/index.template.html',
        target: 'index.html',
        path: '/',
      }),
      // ...StylePlugins, // Prevents warning, but breaks build
      isProduction &&
        QuantumPlugin({
          // treeshake: true, // Tree-shaking removes things that imported like `import * as foo from 'file/path'`
          uglify: {
            es6: true,
          },
        }),
      EnvPlugin({
        NODE_ENV: isProduction ? 'production' : 'development',
        VERSION: version,
      }),
    ],
    cache: true,
    log: true,
    debug: true,
    tsConfig: 'tsconfig.json',
    alias: {
      src: '~',
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
  fuse.bundle('vendor').instructions('~ index.js')

  // bundle app
  app = fuse.bundle('app').instructions('> [index.js]')
})

Sparky.task('default', ['clean', 'copy', 'config'], () => {
  fuse.dev(
    {
      port: 4444,
      open: false,
    },
    server => {
      const dist = path.resolve('./build/assets')
      const appServer = server.httpServer.app
      appServer.use(
        '/chronograf/v1',
        proxy({
          target: 'http://localhost:8888',
        })
      )
      appServer.get('*', function(req, res) {
        const filepath = path.resolve(dist, req.path.substr(1))
        fs.access(filepath, fs.constants.R_OK, err => {
          if (err) {
            res.sendFile(path.resolve(dist, 'index.html'))
          } else {
            res.sendFile(filepath)
          }
        })
      })
    }
  )
  app
    .watch('src/**')
    .plugin(StylePlugins)
    .hmr({
      reload: true,
    })
    .completed(_ => {
      // run the typechecker
      typeHelper.runSync()
    })
  return fuse.run()
})

Sparky.task('clean', () => Sparky.src('build/').clean('build/'))

Sparky.task('copy', () => Sparky.src('assets/**/*').dest('build/'))

Sparky.task('prod-env', ['clean', 'copy'], () => {
  isProduction = true
})

Sparky.task('build', ['prod-env', 'config'], () => {
  app.plugin(StylePlugins)
  return fuse.run()
})
