export const clipPathUrl = elementId => {
  // Other SVG elements are often referenced in SVG attributes like `clip-path`
  // and `mask` using a url, e.g.
  //
  //     <rect clip-path="url(#some-svg-element-id") ... />
  //
  // Chronograf supports a [`--basepath`][0] option that rewrites all instances
  // of `url(` occuring in asset files as they are served, which breaks usages
  // of `url(#...)` strings in SVG elements. This issue has been fixed for
  // standalone SVG files by [#3402][1], but not for inline SVG elements (i.e.
  // those rendered by components). This workaround renders `url(#...)` strings
  // dynamically on the client to evade the server asset rewriting.
  //
  // [0]: https://docs.influxdata.com/chronograf/v1.6/administration/config-options/#chronograf-service-options
  // [1]: https://github.com/influxdata/chronograf/pull/3402
  const leftParen = String.fromCharCode(40)

  return `url${leftParen}#${elementId})`
}
