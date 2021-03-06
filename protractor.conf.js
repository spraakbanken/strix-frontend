// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
exports.config = {
  allScriptsTimeout: 20000,
  SELENIUM_PROMISE_MANAGER: false,
  specs: [
    './e2e/**/*.e2e-spec.ts'
  ],
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      prefs: {
        intl: { accept_languages: "sv" },
      },
    },
  },
  seleniumAddress: "http://" + (process.env.SELENIUM || "localhost") + ":4444/wd/hub",
  // directConnect: true,
  baseUrl: 'http://' + (process.env.STRIX_FRONTEND_DOCKER_HOST || "localhost") +':4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  beforeLaunch: function() {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
  },
  onPrepare() {
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};
