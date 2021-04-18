// Initializes the `auth-management` service on path `/auth-management`
const { AuthManagement } = require('./auth-management.class');
const hooks = require('./auth-management.hooks');

const {
  makeNotifier,
  sanitizeUserForClient
} = require('./auth-management.utils');

module.exports = function (app) {
  const notifier = makeNotifier(app);

  // these are the available options for feathers-authentication-management
  const options = {
    app, // <- this one is required. The following are optional
    service: '/users',
    notifier,
    longTokenLen: 15, // token's length will be twice this
    shortTokenLen: 6,
    shortTokenDigits: true,
    resetDelay: 1000 * 60 * 60 * 2, // 2 hours
    delay: 1000 * 60 * 60 * 24 * 5, // 5 days
    resetAttempts: 0,
    reuseResetToken: false,
    identifyUserProps: ['email'],
    sanitizeUserForClient,
    skipIsVerifiedCheck: false,
    passwordField: 'password'
  };

  // Initialize our service with any options it requires
  app.use('/auth-management', new AuthManagement(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('auth-management');

  service.hooks(hooks);
};
