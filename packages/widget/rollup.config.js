import terser from '@rollup/plugin-terser'

export default {
  input: 'src/affiliatekit.js',
  output: [
    {
      file: 'dist/affiliatekit.js',
      format: 'iife',
      name: 'AffiliateKit',
      exports: 'named',
      banner: '/* AffiliateKit v0.1.0 — https://affiliatekit.threestack.io */',
    },
    {
      file: 'dist/affiliatekit.min.js',
      format: 'iife',
      name: 'AffiliateKit',
      exports: 'named',
      plugins: [terser()],
      banner: '/* AffiliateKit v0.1.0 */',
    },
  ],
}
