import { GeneralError } from '@feathersjs/errors';
import { HookContext } from '@feathersjs/feathers';
import { checkContext } from 'feathers-hooks-common';
import getLongToken from '../helpers/get-long-token';
import getShortToken from '../helpers/get-short-token';
import ensureFieldHasChanged from '../helpers/ensure-field-has-changed';
import { AuthenticationManagementService } from '../services';
import { defaultConfigureOptions } from '../configureAuthManagement';

export default function addVerification (path?: string): ((hook: HookContext) => Promise<HookContext>) {
  path = path || defaultConfigureOptions.path; // default: 'authManagement'
  return async (hook: HookContext): Promise<HookContext> => {
    checkContext(hook, 'before', ['create', 'patch', 'update']);

    try {
      const { options } = (hook.app.service(path) as AuthenticationManagementService);

      const [longToken, shortToken] = await Promise.all([
        getLongToken(options.longTokenLen),
        getShortToken(options.shortTokenLen, options.shortTokenDigits)
      ]);

      if (
        (hook.method === 'patch' || hook.method === 'update') &&
        !!hook.params.user &&
        !options.identifyUserProps.some(ensureFieldHasChanged(hook.data, hook.params.user))
      ) {
        return hook;
      }

      hook.data.isVerified = false;
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      hook.data.verifyExpires = Date.now() + options.delay;
      hook.data.verifyToken = longToken;
      hook.data.verifyShortToken = shortToken;
      hook.data.verifyChanges = {};

      return hook;
    } catch (err) {
      throw new GeneralError(err);
    }
  };
}
