/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {},
  serverDependenciesToBundle: [
    'decode-uri-component',
    'filter-obj',
    'query-string',
    'split-on-first',
  ],
  serverModuleFormat: 'cjs',
  tailwind: true,
}
