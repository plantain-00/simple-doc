module.exports = {
  include: [
    'vendor.bundle-*.js',
    'vendor.bundle-*.css',
    'service-worker.bundle.js',
    'index.html',
    'LICENSE',
    'package.json'
  ],
  exclude: [
  ],
  askVersion: true,
  releaseRepository: 'https://github.com/plantain-00/simple-doc-release.git',
  postScript: [
    'git add package.json',
    ({ version }) => `git commit -m "${version}"`,
    ({ version }) => `git tag -a v${version} -m 'v${version}'`,
    'git push',
    ({ version }) => `git push origin v${version}`
  ]
}
