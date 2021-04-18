const { authenticate } = require('@feathersjs/authentication').hooks;
const { iff } = require('feathers-hooks-common');

const isAction = (...args) => (hook) => args.includes(hook.data.action);

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      // The user must be signed in before being allowed to change their password or communication values.
      iff(isAction('passwordChange', 'identityChange'),
        authenticate('jwt')
      )
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
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
