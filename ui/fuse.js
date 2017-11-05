const {
  FuseBox,
  EnvPlugin,
  SassPlugin,
  PostCSSPlugin,
  CSSPlugin,
  JSONPlugin,
  CopyPlugin,
  QuantumPlugin,
  WebIndexPlugin,
  Sparky,
} = require('fuse-box')

const {version} = require('./package.json')

let fuse, app, isProduction

const productionStylePlugins = [
  SassPlugin({
    sourceMap: false, // https://github.com/sass/libsass/issues/2312
    outputStyle: 'compressed',
    importer: true,
  }),
  PostCSSPlugin([require('autoprefixer'), require('cssnano')], {
    sourceMaps: false,
  }),
  CSSPlugin({
    group: 'chronograf.css',
    outFile: 'build/chronograf.css',
    inject: false,
  }),
  EnvPlugin({
    NODE_ENV: 'production',
    VERSION: JSON.stringify(version),
  }),
]

const devStylePlugins = [
  SassPlugin({
    sourceMap: false, // https://github.com/sass/libsass/issues/2312
    outputStyle: 'expanded',
    importer: true,
  }),
  CSSPlugin({
    group: 'chronograf.css',
    outFile: 'build/chronograf.css',
    inject: false,
  }),
  EnvPlugin({
    NODE_ENV: 'development',
    VERSION: JSON.stringify(version),
  }),
]

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src',
    sourceMaps: !isProduction,
    hash: isProduction,
    target: 'browser',
    output: 'build/$name.js',
    useTypescriptCompiler: true,
    experimentalFeatures: true,
    plugins: [
      JSONPlugin(),
      WebIndexPlugin({
        template: 'src/index.template.html',
      }),
      isProduction &&
        QuantumPlugin({
          treeshake: true,
          uglify: {
            es6: true,
          },
        }),
    ],
    cache: true,
    log: true,
    debug: true,
    tsConfig: 'tsconfig.json',
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

  const stylePlugins = isProduction ? productionStylePlugins : devStylePlugins

  // vendor
  fuse.bundle('vendor').instructions('~ index.tsx')

  // bundle app
  app = fuse
    .bundle('app')
    .plugin(stylePlugins)
    .instructions('> [index.tsx]')
})

Sparky.task('default', ['clean', 'copy', 'config'], () => {
  fuse.dev({
    port: 4444,
    open: false,
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

Sparky.task('copy', () => Sparky.src('assets/').dest('build/'))

Sparky.task('prod-env', ['clean', 'copy'], () => {
  isProduction = true
})

Sparky.task('build', ['prod-env', 'config'], () => {
  return fuse.run()
})
