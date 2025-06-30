const caseSensitivePaths = require('eslint-plugin-case-sensitive-paths');

module.exports = {
  plugins: [
    'case-sensitive-paths',
    'import',
  ],
  rules: {
    'case-sensitive-paths/case-sensitive-paths': 'error',
    'import/no-unresolved': [2, { caseSensitive: true }],
  },
}; 