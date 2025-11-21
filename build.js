const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  platform: 'node',
  target: 'node18',
  alias: {
    '@': './src'
  }
}).catch(() => process.exit(1));