module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [2, 'always', 200],
    'header-max-length': [2, 'always', 150],
    'footer-max-length': [2, 'always', 150],
  },
};
