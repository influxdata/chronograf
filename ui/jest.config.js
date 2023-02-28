module.exports = {
  projects: [
    {
      testEnvironment: 'jsdom',
      displayName: 'test',
      testPathIgnorePatterns: [
        'build',
        '<rootDir>/cypress/',
        '<rootDir>/node_modules/(?!(jest-test))',
      ],
      modulePaths: ['<rootDir>', '<rootDir>/..'],
      moduleDirectories: ['src', 'node_modules'],
      setupFiles: ['<rootDir>/test/setup.js'],
      transform: {
        '^.+\\.[jt]sx?$': ['babel-jest', {configFile: './.babelrc.jest'}],
      },
      transformIgnorePatterns: ['/node_modules/(?!(d3-.*|internmap)/)'],
      testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      snapshotSerializers: ['enzyme-to-json/serializer'],
      moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
      },
    },
    {
      runner: 'jest-runner-eslint',
      displayName: 'eslint',
      testMatch: ['<rootDir>/test/**/*.test.js'],
    },
  ],
}
