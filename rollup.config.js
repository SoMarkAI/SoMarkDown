import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

const onwarn = (warning, warn) => {
  if (warning.code === 'CIRCULAR_DEPENDENCY' && /node_modules/.test(warning.message || '')) return;
  warn(warning);
};

const resolvePlugin = resolve({
  browser: true,
  preferBuiltins: false
});

const sassUse = {
  sass: {
    silenceDeprecations: ['legacy-js-api']
  }
};

const postcssExtract = postcss({
  extract: 'somarkdown.css',
  minimize: false,
  sourceMap: true,
  extensions: ['.css', '.scss'],
  use: sassUse,
});

const postcssIgnore = postcss({
  extract: false,
  inject: false,
  minimize: false,
  sourceMap: false,
  extensions: ['.css', '.scss'],
  use: sassUse,
});

export default [
  // ESM build (Node/bundlers)
  {
    input: 'src/index.bundle.js',
    onwarn,
    output: {
      file: 'dist/somarkdown.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolvePlugin,
      commonjs(),
      postcssExtract,
      babel({ babelHelpers: 'bundled' })
    ]
  },
  // Development build (UMD)
  {
    input: 'src/index.bundle.js',
    onwarn,
    output: {
      file: 'dist/somarkdown.umd.js',
      format: 'umd',
      name: 'SoMarkDown',
      sourcemap: true,
      globals: {
        'markdown-it': 'markdownit',
        'katex': 'katex',
        'highlight.js': 'hljs',
        'smiles-drawer': 'SmilesDrawer'
      }
    },
    plugins: [
      resolvePlugin,
      commonjs(),
      postcssIgnore,
      babel({ babelHelpers: 'bundled' }),
    ]
  },
  // Production build (Minified UMD)
  {
    input: 'src/index.bundle.js',
    onwarn,
    output: {
      file: 'dist/somarkdown.umd.min.js',
      format: 'umd',
      name: 'SoMarkDown',
      sourcemap: true,
      globals: {
        'markdown-it': 'markdownit',
        'katex': 'katex',
        'highlight.js': 'hljs',
        'smiles-drawer': 'SmilesDrawer'
      }
    },
    plugins: [
      resolvePlugin,
      commonjs(),
      postcssIgnore,
      babel({ babelHelpers: 'bundled' }),
      terser()
    ]
  }
];
