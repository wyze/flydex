/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  serverDependenciesToBundle: [
    'decode-uri-component',
    'filter-obj',
    'query-string',
    'split-on-first',
  ],
  serverModuleFormat: 'cjs',
  tailwind: true,
}
