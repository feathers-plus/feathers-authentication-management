module.exports = {
  root: true,
  env: {
    node: true,
    mocha: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json'
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard-with-typescript'
  ],
  rules: {
    semi: ['warn', 'always'],
    '@typescript-eslint/semi': ['warn', 'always'],
    '@typescript-eslint/strict-boolean-expressions': ['off'],
    'spaced-comment': ['off']
  },
  overrides: [
    {
      files: ['test/**/*.ts'],
      rules: {
        '@typescript-eslint/ban-ts-comment': ['off']
      }
    }
  ]
};
