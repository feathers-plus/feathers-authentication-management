import { HookContext } from '@feathersjs/feathers';

import { checkContext, getItems, replaceItems } from 'feathers-hooks-common';
import { User } from '../types';

export default function removeVerification (
  ifReturnTokens?: boolean
): ((hook: HookContext) => HookContext) {
  return (hook: HookContext): HookContext => {
    checkContext(hook, 'after');
    // Retrieve the items from the hook
    const items: User | User[] = getItems(hook);
    if (!items) return;
    const isArray = Array.isArray(items);
    const users = ((isArray) ? items : [items]) as User[];

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
    });
    // Replace the items within the hook
    replaceItems(hook, isArray ? users : users[0]);
    return hook;
  };
}
