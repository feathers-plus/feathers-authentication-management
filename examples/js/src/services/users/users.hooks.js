const { authenticate } = require('@feathersjs/authentication').hooks;
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const { addVerification, removeVerification } = require('feathers-authentication-management').hooks;

const {
  checkContext,
  disallow,
  iff,
  isProvider,
  preventChanges,
  getItems
} = require('feathers-hooks-common');

const { makeNotifier } = require('../auth-management/auth-management.utils');

const sendVerifySignup = () => {
  return async context => {
    checkContext(context, 'after', 'create');
    let users = getItems(context);
    users = (Array.isArray(users)) ? users : [users];
    const notify = makeNotifier(context.app);
    const promises = users.map(user => notify(
      'resendVerifySignup',
      user
    ));
    await Promise.all(promises);
  };
};

module.exports = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ authenticate('jwt') ],
    create: [
      hashPassword('password'),
      addVerification(), // adds .isVerified, .verifyExpires, .verifyToken, .verifyChanges
    ],
    update: [
      disallow('external'),
      authenticate('jwt'),
      hashPassword('password')
    ],
    patch: [
      authenticate('jwt'),
      iff(
        isProvider('external'),
        preventChanges(
          false,
          'email',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires'
        ),
        hashPassword('password'),
      )
    ],
    remove: [
      authenticate('jwt'),
      hashPassword('password')
    ]
  },
  after: {
    all: [
      protect('password'),
      removeVerification() // removes verification/reset fields other than .isVerified from the response
    ],
    find: [],
    get: [],
    create: [
      sendVerifySignup()
    ],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
