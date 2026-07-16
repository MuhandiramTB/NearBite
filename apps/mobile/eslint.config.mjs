import base from '@nearbite/config/eslint';

export default [
  ...base,
  {
    // CommonJS build-tooling files (metro/babel) aren't app source.
    ignores: ['.expo/**', 'android/**', 'ios/**', '*.cjs'],
  },
];
