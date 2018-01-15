
/* eslint no-param-reassign: 0 */

const errors = require('feathers-errors');
const { checkContext, getItems, replaceItems } = require('feathers-hooks-common');
const { getLongToken, getShortToken, ensureFieldHasChanged } = require('./helpers');

module.exports.addVerification = path => hook => {
  checkContext(hook, 'before', ['create', 'patch', 'update']);

  return Promise.resolve()
    .then(() => hook.app.service(path || 'authManagement').create({ action: 'options' }))
    .then(options => Promise.all([
      options,
      getLongToken(options.longTokenLen),
      getShortToken(options.shortTokenLen, options.shortTokenDigits)
    ]))
    .then(([options, longToken, shortToken]) => {
      // We do NOT add verification fields if the 3 following conditions are fulfilled:
      // - hook is PATCH or PUT
      // - user is authenticated
      // - user's identifyUserProps fields did not change
      if (
        (hook.method === 'patch' || hook.method === 'update') &&
        !!hook.params.user &&
        !options.identifyUserProps.some(ensureFieldHasChanged(hook.data, hook.params.user))
      ) {
        return hook;
      }

      hook.data.isVerified = false;
      hook.data.verifyExpires = new Date(Date.now() + options.delay);
      hook.data.verifyToken = longToken;
      hook.data.verifyShortToken = shortToken;
      hook.data.verifyChanges = {};

      return hook;
    })
    .catch(err => { throw new errors.GeneralError(err); });
};

module.exports.isVerified = () => hook => {
  checkContext(hook, 'before');

  if (!hook.params.user || !hook.params.user.isVerified) {
    throw new errors.BadRequest('User\'s email is not yet verified.');
  }
};

module.exports.removeVerification = ifReturnTokens => hook => {
  checkContext(hook, 'after');
  // Retrieve the items from the hook
  let users = getItems(hook)
  if (!users) return
  const isArray = Array.isArray(users)
  users = (isArray ? users : [users])
  
  users.forEach(user => {
    if (!('isVerified' in user) && hook.method === 'create') {
      /* eslint-disable no-console */
      console.warn('Property isVerified not found in user properties. (removeVerification)');
      console.warn('Have you added authManagement\'s properties to your model? (Refer to README.md)');
      console.warn('Have you added the addVerification hook on users::create?');
      /* eslint-enable */
    }

    if (hook.params.provider && user) { // noop if initiated by server
      delete user.verifyExpires;
      delete user.resetExpires;
      delete user.verifyChanges;
      if (!ifReturnTokens) {
        delete user.verifyToken;
        delete user.verifyShortToken;
        delete user.resetToken;
        delete user.resetShortToken;
      }
    }
  })
  // Replace the items within the hook
  replaceItems(hook, isArray ? users : users[0])
};
