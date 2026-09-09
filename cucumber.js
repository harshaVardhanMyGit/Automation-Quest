require('dotenv/config');

module.exports = {
  default: {
    paths: ['src/tests/features/**/*.feature'],
    require: ['src/tests/step-definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress', 'html:reports/cucumber-report.html'],
    publishQuiet: true,
  },
};
