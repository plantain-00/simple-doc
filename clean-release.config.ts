export default {
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
  postScript: ({ version }) => [
    'git add package.json',
    `git commit -m "${version}"`,
    `git tag -a v${version} -m 'v${version}'`,
    'git push',
    `git push origin v${version}`
  ]
}
