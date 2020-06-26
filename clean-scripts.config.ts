import { executeScriptAsync } from 'clean-scripts'
import { watch } from 'watch-then-execute'

const tsFiles = `"*.ts"`
const jsFiles = `"*.config.js"`
const lessFiles = `"*.less"`

const isDev = process.env.NODE_ENV === 'development'

const templateCommand = 'file2variable-cli --config file2variable.config.ts'
const webpackCommand = 'webpack --config webpack.config.ts'
const revStaticCommand = 'rev-static'
const cssCommand = [
  'lessc index.less > index.css',
  `postcss index.css -o index.postcss.css`,
  'cleancss -o index.bundle.css index.postcss.css'
]
const swCommand = isDev ? undefined : [
  'sw-precache --config sw-precache.config.js --verbose',
  'uglifyjs service-worker.js -o service-worker.bundle.js'
]

module.exports = {
  build: [
    {
      js: [
        templateCommand,
        webpackCommand
      ],
      css: {
        vendor: isDev ? undefined : 'cleancss -o vendor.bundle.css ./node_modules/github-fork-ribbon-css/gh-fork-ribbon.css ./node_modules/tree-component/dist/tree.min.css ./node_modules/highlight.js/styles/routeros.css',
        index: cssCommand
      },
      clean: 'rimraf *.bundle-*.js *.bundle-*.css'
    },
    revStaticCommand,
    swCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    less: `stylelint ${lessFiles}`,
    export: `no-unused-export ${tsFiles} ${lessFiles}`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p . --strict --ignore-catch --ignore-files "variables.ts"'
  },
  test: [],
  fix: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`,
    less: `stylelint --fix ${lessFiles}`
  },
  watch: {
    template: `${templateCommand} --watch`,
    webpack: `${webpackCommand} --watch`,
    less: () => watch(['*.less'], [], () => executeScriptAsync(cssCommand)),
    rev: `${revStaticCommand} --watch`
  }
}
