import fluxString from 'src/flux/helpers/fluxString'

describe('Flux.helpers.fluxString', () => {
  ;[
    {
      js: ``,
      flux: `""`,
    },
    {
      js: `ab_cd`,
      flux: `"ab_cd"`,
    },
    {
      js: '\r\n\t"\\',
      flux: `"\\r\\n\\t\\"\\\\"`,
      name: '\\r\\n\\t"\\',
    },
    {
      js: '${\u03A9$',
      flux: '"\\${\u03A9$"',
    },
  ].forEach(({js, flux, name}) =>
    it(`creates flux sring from "${name ? name : JSON.stringify(js)}"`, () => {
      expect(fluxString(js)).toEqual(flux)
    })
  )
})
